import AppKit
import ApplicationServices
import CryptoKit

// Private stdio helper. The network server validates and authenticates every request.
let allowed = ["codex":"com.openai.codex", "wps":"com.kingsoft.wpsoffice.mac.global", "workbuddy":"com.tencent.workbuddy.mac"]
let system = AXUIElementCreateSystemWide()
var lastElement: AXUIElement? = nil
var lastWindow: AXUIElement? = nil
var lastApp = ""
var lastTitle = ""
var accessibilityPIDs=Set<pid_t>()
var focusID = UUID().uuidString
var windowID = UUID().uuidString
var held = false
let appSwitcher = NativeAppSwitcher(command: { down in
 let event=CGEvent(keyboardEventSource:nil,virtualKey:55,keyDown:down)
 event?.flags=down ? .maskCommand:[]; event?.post(tap:.cghidEventTap)
}, tab: { key(48,.maskCommand) }, escape: { key(53) })
var taskElements:[String:AXUIElement]=[:]
var taskKeys:[String:String]=[:]
var lastTaskTitle=""
func attr(_ el: AXUIElement, _ name: String) -> CFTypeRef? { var out:CFTypeRef?; return AXUIElementCopyAttributeValue(el,name as CFString,&out) == .success ? out : nil }
func str(_ el: AXUIElement, _ name: String) -> String { attr(el,name) as? String ?? "" }
func element(_ el: AXUIElement, _ name:String) -> AXUIElement? { guard let v=attr(el,name), CFGetTypeID(v)==AXUIElementGetTypeID() else{return nil}; return (v as! AXUIElement) }
func settable(_ el:AXUIElement,_ name:String)->Bool { var b:DarwinBoolean=false; return AXUIElementIsAttributeSettable(el,name as CFString,&b) == .success && b.boolValue }
func equal(_ a:AXUIElement?,_ b:AXUIElement?)->Bool { if a == nil && b == nil{return true}; guard let a=a,let b=b else{return false};return CFEqual(a,b) }
func selection(_ el:AXUIElement)->[Int]? { guard let v=attr(el,"AXSelectedTextRange"),CFGetTypeID(v)==AXValueGetTypeID() else{return nil}; var range=CFRange();guard AXValueGetValue(v as! AXValue,.cfRange,&range) else{return nil};return [range.location,range.length] }
func front(includeFocus:Bool=true)->(NSRunningApplication?,AXUIElement?,AXUIElement?) { RunLoop.current.run(until:Date(timeIntervalSinceNow:0.005));let app=NSWorkspace.shared.frontmostApplication; guard let app=app else{return(nil,nil,nil)};let ax=AXUIElementCreateApplication(app.processIdentifier);AXUIElementSetMessagingTimeout(ax,0.5);
 if ["com.openai.codex","com.tencent.workbuddy.mac","com.google.Chrome"].contains(app.bundleIdentifier ?? "") && !accessibilityPIDs.contains(app.processIdentifier) {_ = AXUIElementSetAttributeValue(ax,"AXManualAccessibility" as CFString,kCFBooleanTrue);accessibilityPIDs.insert(app.processIdentifier)}
 let windows=attr(ax,"AXWindows") as? [AXUIElement] ?? []
 return(app,element(ax,"AXFocusedWindow") ?? element(ax,"AXMainWindow") ?? windows.first,includeFocus ? (element(ax,"AXFocusedUIElement") ?? element(system,"AXFocusedUIElement")) : nil) }
func frame(_ el:AXUIElement)->CGRect? {guard let p=attr(el,"AXPosition"),let z=attr(el,"AXSize"),CFGetTypeID(p)==AXValueGetTypeID(),CFGetTypeID(z)==AXValueGetTypeID() else{return nil};var point=CGPoint.zero;var size=CGSize.zero;guard AXValueGetValue(p as! AXValue,.cgPoint,&point),AXValueGetValue(z as! AXValue,.cgSize,&size),size.width>1,size.height>1 else{return nil};return CGRect(origin:point,size:size)}
// AX/CG coordinates share a top-left origin. Use full display bounds, not visibleFrame (which excludes Dock).
func pointerDisplay(_ win:AXUIElement)->CGRect {
 let window=frame(win) ?? CGDisplayBounds(CGMainDisplayID())
 var displays=[CGDirectDisplayID](repeating:0,count:32);var count:UInt32=0
 guard CGGetActiveDisplayList(32,&displays,&count) == .success else{return CGDisplayBounds(CGMainDisplayID())}
 return displays.prefix(Int(count)).map{CGDisplayBounds($0)}.max{a,b in
  let x=a.intersection(window),y=b.intersection(window)
  return (x.isNull ? 0:x.width*x.height)<(y.isNull ? 0:y.width*y.height)
 } ?? CGDisplayBounds(CGMainDisplayID())
}
func subapp(_ title:String)->String { let t=title.lowercased(); if t.range(of:"\\.(docx?|odt)(?:$|[ —-])",options:.regularExpression) != nil{return "writer"};if t.range(of:"\\.(xlsx?|csv)(?:$|[ —-])",options:.regularExpression) != nil{return "sheet"};if t.range(of:"\\.(pptx?|odp)(?:$|[ —-])",options:.regularExpression) != nil{return "presentation"};return "unknown" }
func composerSubmissionKind(_ value:String)->String? {
 switch value.trimmingCharacters(in:.whitespacesAndNewlines).lowercased() {
 case "submit edit instruction","send","send message","send prompt","发送","发送消息","提交":return "send"
 case "queue","queue message","queue prompt","send follow-up","send follow up","add to queue","加入队列","排队发送":return "queue"
 default:return nil
 }
}
func submitButton(_ field:AXUIElement)->AXUIElement? {
 var node:AXUIElement?=field
 let boundary=lastApp=="com.openai.codex" ? scopedComposerRegion(field):agentRoot
 for _ in 0..<7 {guard let n=node,!equal(n,agentRoot) else{break};let matches=descendants(n).filter{str($0,"AXRole")=="AXButton" && attr($0,"AXEnabled") as? Bool==true && labels($0).contains{composerSubmissionKind($0) != nil}};if matches.count==1{return matches[0]};if matches.count>1{return nil};if equal(n,boundary){break};node=element(n,"AXParent")};return nil
}
func scopedComposerRegion(_ field:AXUIElement)->AXUIElement {
 var root=field
 for _ in 0..<4 {guard let next=element(root,"AXParent"),!equal(next,agentRoot),!descendants(next).contains(where:{str($0,"AXRole")=="AXHeading"}) else{break};root=next}
 return root
}
struct ComposerActionHandle {let id:String;let owner:String;let kind:String;let label:String;let node:AXUIElement;let fingerprint:String}
var composerActionHandles:[ComposerActionHandle]=[]
func composerAction(_ node:AXUIElement,_ kind:String,_ field:AXUIElement)->[String:Any] {
 let label=str(node,"AXTitle").isEmpty ? str(node,"AXDescription"):str(node,"AXTitle")
 let content=kind=="steer" ? visibleTexts(element(node,"AXParent") ?? node,excluding:field).joined(separator:"\n"):""
 let fingerprint=SHA256.hash(data:Data(content.utf8)).map{String(format:"%02x",$0)}.joined()
 let existing=composerActionHandles.first{$0.owner==focusID && $0.kind==kind && $0.label==label && $0.fingerprint==fingerprint && (kind != "steer" || equal($0.node,node))}
 let id=existing?.id ?? UUID().uuidString
 if let i=composerActionHandles.firstIndex(where:{$0.id==id}){composerActionHandles.remove(at:i)}
 composerActionHandles.append(ComposerActionHandle(id:id,owner:focusID,kind:kind,label:label,node:node,fingerprint:fingerprint))
 if composerActionHandles.count>64{composerActionHandles.removeFirst(composerActionHandles.count-64)}
 return ["id":id,"kind":kind,"label":label,"enabled":attr(node,"AXEnabled") as? Bool==true]
}
// Only the observed Codex selection toolbar is registered. Never harvest transcript Edit buttons.
struct SelectionActionHandle {let id:String;let owner:String;let kind:String;let node:AXUIElement;let source:AXUIElement;let signature:String}
var selectionActionHandles:[SelectionActionHandle]=[]
func selectedSignature(_ field:AXUIElement)->String? {
 guard let range=selection(field),range[1]>0,let text=attr(field,"AXSelectedText") as? String,!text.isEmpty else{return nil}
 return SHA256.hash(data:Data((String(range[0])+"/"+String(range[1])+"/"+text+"/"+str(field,"AXValue")).utf8)).map{String(format:"%02x",$0)}.joined()
}
func selectionActions(_ app:String,_ nodes:[AXUIElement],_ main:AXUIElement?)->[[String:Any]] {
 guard app=="codex" else{return []}
 let sources=nodes.filter{str($0,"AXRole")=="AXTextArea" && !equal($0,main) && selectedSignature($0) != nil}
 guard sources.count==1,let source=sources.first,let signature=selectedSignature(source) else{return []}
 let groups=nodes.filter{n in
  guard str(n,"AXRole")=="AXGroup" else{return false}
  let children=attr(n,"AXChildren") as? [AXUIElement] ?? []
  return children.count==2 && children.allSatisfy{str($0,"AXRole")=="AXButton"} && children.contains{named($0,["add to chat"])} && children.contains{named($0,["edit"])}
 }
 guard groups.count==1 else{return []}
 return (attr(groups[0],"AXChildren") as? [AXUIElement] ?? []).map{node in
  let kind=named(node,["edit"]) ? "edit":"add-to-chat"
  let existing=selectionActionHandles.first{$0.owner==focusID && $0.kind==kind && $0.signature==signature && equal($0.node,node) && equal($0.source,source)}
  let id=existing?.id ?? UUID().uuidString
  if existing==nil{selectionActionHandles.append(SelectionActionHandle(id:id,owner:focusID,kind:kind,node:node,source:source,signature:signature))}
  if selectionActionHandles.count>32{selectionActionHandles.removeFirst(selectionActionHandles.count-32)}
  return ["id":id,"kind":kind,"label":str(node,"AXTitle"),"enabled":attr(node,"AXEnabled") as? Bool==true]
 }
}
struct EditReviewHandle {
 let id:String;let owner:String;let card:AXUIElement;let source:AXUIElement;let fingerprint:String
 let before:String;let after:String;let actions:[String:AXUIElement];let actionIDs:[String:String]
}
var editReviewHandles:[EditReviewHandle]=[]
struct ReviewDocumentTarget {let field:AXUIElement;let conversation:String;let document:String;let id:String}
var reviewDocumentTarget:ReviewDocumentTarget?=nil
func reviewParts(_ card:AXUIElement)->(String,String,[String:AXUIElement])? {
 let c=attr(card,"AXChildren") as? [AXUIElement] ?? []
 guard c.count==3,str(c[0],"AXRoleDescription")=="deletion",str(c[1],"AXRoleDescription")=="insertion" else{return nil}
 let buttons=attr(c[2],"AXChildren") as? [AXUIElement] ?? []
 guard buttons.count==3,buttons.allSatisfy({str($0,"AXRole")=="AXButton"}),["edit","reject","accept"].allSatisfy({kind in buttons.contains{named($0,[kind])}}) else{return nil}
 let text: (AXUIElement)->String = {root in descendants(root).filter{str($0,"AXRole")=="AXStaticText"}.map{str($0,"AXValue")}.joined(separator:"\n")}
 return (text(c[0]),text(c[1]),Dictionary(uniqueKeysWithValues:buttons.map{(str($0,"AXTitle").lowercased(),$0)}))
}
func reviewDocumentLabel(_ source:AXUIElement)->String {
 var current=element(source,"AXParent")
 for _ in 0..<12 {guard let n=current else{break};let title=str(n,"AXTitle");if !title.isEmpty{return title};current=element(n,"AXParent")}
 return ""
}
func reviewFingerprint(_ card:AXUIElement,_ source:AXUIElement)->String? {
 guard let parts=reviewParts(card) else{return nil}
 return SHA256.hash(data:Data((parts.0+"\u{0}"+parts.1+"\u{0}"+reviewDocumentLabel(source)+"\u{0}"+str(source,"AXValue")).utf8)).map{String(format:"%02x",$0)}.joined()
}
func editReviews(_ app:String,_ nodes:[AXUIElement])->[[String:Any]] {
 guard app=="codex" else{return []}
 var result:[[String:Any]]=[]
 for card in nodes where str(card,"AXRole")=="AXGroup" {
  guard let (before,after,actions)=reviewParts(card),let source=element(card,"AXParent"),str(source,"AXRole")=="AXTextArea",let fingerprint=reviewFingerprint(card,source) else{continue}
  let previous=editReviewHandles.first{$0.owner==focusID && equal($0.card,card) && equal($0.source,source) && $0.fingerprint==fingerprint}
  let id=previous?.id ?? UUID().uuidString
  let ids=previous?.actionIDs ?? Dictionary(uniqueKeysWithValues:["edit","reject","accept"].map{($0,UUID().uuidString)})
  if previous==nil{editReviewHandles.append(EditReviewHandle(id:id,owner:focusID,card:card,source:source,fingerprint:fingerprint,before:before,after:after,actions:actions,actionIDs:ids))}
  let bounded=before.utf16.count<=12000 && after.utf16.count<=12000
  result.append(["id":id,"document":reviewDocumentLabel(source),"before":String(before.prefix(12000)),"after":String(after.prefix(12000)),"truncated":!bounded,"actions":["edit","reject","accept"].map{kind -> [String:Any] in let node=actions[kind]!;return ["id":ids[kind]!,"kind":kind,"label":str(node,"AXTitle"),"enabled":bounded && attr(node,"AXEnabled") as? Bool==true]}])
  if result.count>=12{break}
 }
 if editReviewHandles.count>64{editReviewHandles.removeFirst(editReviewHandles.count-64)}
 return result
}
// Review buttons expose a child text node at the hit point. Verify that exact AX ancestry before clicking.
func clickReviewControl(_ button:AXUIElement)->Bool {
 guard let r=frame(button),attr(button,"AXEnabled") as? Bool==true else{return false}
 let p=CGPoint(x:r.midX,y:r.midY);var hit:AXUIElement?=nil
 guard AXUIElementCopyElementAtPosition(system,Float(p.x),Float(p.y),&hit) == .success else{return false}
 guard equal(hit,button) || hit.flatMap({element($0,"AXParent")}).map({equal($0,button)})==true else{return false}
 for type in [CGEventType.leftMouseDown,.leftMouseUp]{CGEvent(mouseEventSource:nil,mouseType:type,mouseCursorPosition:p,mouseButton:.left)?.post(tap:.cghidEventTap)}
 return true
}
// A registered page root is the boundary: never traverse a browser address bar as an editor.
func axURL(_ n:AXUIElement)->String {(attr(n,"AXURL") as? URL)?.absoluteString ?? str(n,"AXURL")}
func agentPage(_ win:AXUIElement)->AXUIElement? {
 var queue=[win],pages:[AXUIElement]=[];var visited=0
 while !queue.isEmpty && visited<240 {let n=queue.removeFirst();visited+=1;if str(n,"AXRole")=="AXWebArea" {if registeredWebApp(axURL(n)) != nil{pages.append(n)};continue};queue.append(contentsOf:(attr(n,"AXChildren") as? [AXUIElement] ?? []).prefix(80))}
 return pages.count==1 ? pages[0]:nil
}
func registeredWebApp(_ value:String)->String? {
 guard let u=URL(string:value),u.scheme=="https",u.user==nil,u.password==nil,u.port==nil else{return nil}
 if u.host=="chatgpt.com",u.path=="/" || u.path.hasPrefix("/c/") || u.path.hasPrefix("/g/"){return "chatgpt"}
 if u.host=="gemini.google.com",u.path=="/" || u.path=="/app" || u.path.hasPrefix("/app/"){return "gemini"}
 return nil
}
func labels(_ n:AXUIElement)->[String] {[str(n,"AXTitle"),str(n,"AXDescription"),str(n,"AXHelp")].map{$0.trimmingCharacters(in:.whitespacesAndNewlines).lowercased()}}
func named(_ n:AXUIElement,_ names:[String])->Bool {labels(n).contains{names.contains($0)}}
func primaryPrompt(_ app:String,_ nodes:[AXUIElement],_ focused:AXUIElement?)->AXUIElement? {
 if app=="codex",let proof=reviewDocumentTarget,nodes.contains(where:{equal($0,proof.field)}) {return proof.field}
 if app=="codex" {
  let edits=nodes.filter{n in
   guard str(n,"AXRole")=="AXTextField",named(n,["edit instruction"]),let parent=element(n,"AXParent") else{return false}
   let children=attr(parent,"AXChildren") as? [AXUIElement] ?? []
   return children.count==2 && children.contains{str($0,"AXRole")=="AXButton" && named($0,["submit edit instruction"])}
  }
  if edits.count==1{return edits[0]}
 }
 if app=="workbuddy" {if let focused=focused,str(focused,"AXRole")=="AXTextArea",nodes.contains(where:{equal($0,focused)}){return focused};let fields=nodes.filter{str($0,"AXRole")=="AXTextArea"};return fields.count==1 ? fields[0]:nil}
 let names=app=="codex" ? ["work with codex","do anything"]:app=="chatgpt" ? ["使用 chatgpt work","ask anything","message chatgpt","向 chatgpt 发送消息"]:["enter a prompt for gemini"]
 let fields=nodes.filter{str($0,"AXRole")=="AXTextArea" && named($0,names)}
 return fields.count==1 ? fields[0]:nil
}
struct TaskHandle {let app:String;let window:AXUIElement;let element:AXUIElement;let identity:String;let title:String;let id:String}
var taskHandles:[TaskHandle]=[]
var agentRoot:AXUIElement?=nil
var agentPageIdentity=""
var agentNew:AXUIElement?=nil
var agentStop:AXUIElement?=nil
var lastConversation=""
var taskExpectedLabels:[String:String]=[:]
var ambiguousTaskTitles=Set<String>()
var attachmentProof:[String:[String:String]]=[:]
struct NewConversationProof {let app:String;let window:AXUIElement;let title:String;let field:AXUIElement?;let id:String}
var pendingNewConversation:NewConversationProof?=nil
var activeNewConversation:NewConversationProof?=nil
func taskHandle(_ app:String,_ win:AXUIElement,_ n:AXUIElement)->String {
 let identity=axURL(n).isEmpty ? str(n,"AXIdentifier"):axURL(n)
 if let h=taskHandles.first(where:{$0.app==app && $0.title==str(n,"AXTitle") && equal($0.window,win) && ((!identity.isEmpty && $0.identity==identity)||equal($0.element,n))}){return h.id}
 let id=UUID().uuidString;taskHandles.append(TaskHandle(app:app,window:win,element:n,identity:identity,title:str(n,"AXTitle"),id:id));if taskHandles.count>512{taskHandles.removeFirst()};return id
}
// Keep the uniquely observed current conversation even beyond the bounded sidebar list.
func boundedTaskIndexes(_ titles:[String],_ observed:String,_ limit:Int=60)->[Int] {
 guard limit>0 else{return []};var indexes=Array(titles.indices.prefix(limit))
 let matches=titles.indices.filter{titles[$0]==observed && !observed.isEmpty}
 if matches.count==1,let current=matches.first,!indexes.contains(current){indexes[indexes.count-1]=current}
 return indexes
}
func codexRecentsRows(_ nodes:[AXUIElement])->[AXUIElement]? {
 let headers=nodes.filter{str($0,"AXRole")=="AXButton" && named($0,["recents","最近","最近会话"])}
 guard headers.count==1,let section=element(headers[0],"AXParent") else{return nil}
 let lists=descendants(section).filter{str($0,"AXRole")=="AXList"}
 guard lists.count==1 else{return nil}
 // Depth first preserves the order of rows even when wrappers have different depths.
 var stack=[lists[0]],rows:[AXUIElement]=[];var visited=0
 while let n=stack.popLast(),visited<3200 {
  visited+=1
  if str(n,"AXRole")=="AXButton",!str(n,"AXTitle").isEmpty,descendants(n).contains(where:{named($0,["archive chat","归档聊天"])}) {rows.append(n);continue}
  stack.append(contentsOf:((attr(n,"AXChildren") as? [AXUIElement] ?? []).prefix(100)).reversed())
 }
 return rows
}
func codexRowStatus(_ indicators:[String])->String {
 let values=Set(indicators.map{$0.trimmingCharacters(in:.whitespacesAndNewlines).lowercased()})
 if !values.isDisjoint(with:["need input","needs input","waiting for input","awaiting input","需要输入","等待输入"]){return "needs-input"}
 if !values.isDisjoint(with:["working","执行中","正在运行"]){return "running"}
 if !values.isDisjoint(with:["unread","未读"]){return "unread"}
 return "unknown"
}
func codexTaskStatus(_ row:AXUIElement)->String {
 let title=str(row,"AXTitle")
 return codexRowStatus(descendants(row).filter{["AXGroup","AXImage","AXStaticText"].contains(str($0,"AXRole"))}.flatMap{n -> [String] in
  // Exclude the chat title itself, even when it happens to say Working or Unread.
  (labels(n)+[str(n,"AXValue")]).filter{!$0.isEmpty && $0.lowercased() != title.lowercased()}
 })
}
func agentTasks(_ app:String,_ win:AXUIElement,_ nodes:[AXUIElement])->[[String:String]] {
 var candidates:[AXUIElement]=[]
 if app=="workbuddy" {candidates=workbuddyTasks(win,nodes).compactMap{taskElements[$0["id"] ?? ""]}}
 else if app=="codex" {candidates=nodes.filter{n in guard str(n,"AXRole")=="AXButton",!str(n,"AXTitle").isEmpty else{return false};let children=descendants(n);return children.contains{named($0,["archive chat","归档聊天"])} && !children.contains{labels($0).contains{$0.hasPrefix("start new chat in ")}}}}
 else {candidates=nodes.filter{n in guard str(n,"AXRole")=="AXLink",let u=URL(string:axURL(n)),registeredWebApp(axURL(n))==app else{return false};return app=="chatgpt" ? u.path.hasPrefix("/c/"):u.path.hasPrefix("/app/")}}
 if app=="codex" {
  // The observed Recents header and list share a section. Project lists contain
  // duplicate aliases and must not replace this authoritative chronological order.
  if let recent=codexRecentsRows(nodes){candidates=recent}else{candidates=[]}
 }
 taskElements.removeAll();taskExpectedLabels.removeAll();var result:[[String:String]]=[]
 let titles=candidates.map{str($0,"AXTitle")};ambiguousTaskTitles=Set(Dictionary(grouping:titles,by:{$0}).filter{$0.value.count>1}.keys)
 let observed=app=="codex" ? nodes.first{str($0,"AXRole")=="AXWebArea"}.map{str($0,"AXTitle")} ?? "":""
 for index in boundedTaskIndexes(titles,observed) {let n=candidates[index];let title=str(n,"AXTitle");guard !title.isEmpty else{continue};let id=taskHandle(app,win,n);if taskElements[id] != nil || taskElements.values.contains(where:{equal($0,n)}){continue};taskElements[id]=n;taskExpectedLabels[id]=title;var item=["id":id,"title":String(title.prefix(160))];if app=="codex"{item["status"]=codexTaskStatus(n)};result.append(item)};return result
}
func agentText(_ app:String,_ field:AXUIElement)->String? {
 guard let raw=attr(field,"AXValue") as? String else{return nil}
 let trimmed=raw.trimmingCharacters(in:.whitespacesAndNewlines)
 let placeholder=str(field,"AXPlaceholderValue")
 let knownPlaceholder=["gemini":"Ask Gemini","chatgpt":"使用 ChatGPT Work","codex":"Work with Codex"][app]
 if knownPlaceholder==trimmed || app=="codex" && trimmed=="Do anything" {return ""}
 if submitButton(field)==nil && ((!placeholder.isEmpty && trimmed==placeholder) || app=="gemini" && trimmed=="Ask Gemini") {return ""}
 return raw
}
func state()->[String:Any] {
 if let upload=uploadSnapshot(){return upload}
 let (app,win,focused)=front();let bundle=app?.bundleIdentifier ?? ""
 var known=allowed.first(where:{$0.value==bundle})?.key ?? "unknown"
 let page=bundle=="com.google.Chrome" ? win.flatMap{agentPage($0)}:nil
 if let page=page {known=registeredWebApp(axURL(page)) ?? "unknown"}
 let root=page ?? win;let isAgent=["codex","workbuddy","chatgpt","gemini"].contains(known)
 let nodes=isAgent ? root.map{descendants($0)} ?? []:[]
 var el=isAgent ? primaryPrompt(known,nodes,focused):focused
 let pageID=page.map{axURL($0)} ?? "";let titleKey=win.map{str($0,"AXTitle").trimmingCharacters(in:CharacterSet(charactersIn:"* "))} ?? ""
 let windowChanged = !equal(win,lastWindow)||bundle != lastApp
 if windowChanged {releaseMouse();windowID=UUID().uuidString}
 agentRoot=root;agentNew=nodes.first{["AXButton","AXLink","AXRadioButton","AXTab"].contains(str($0,"AXRole")) && named($0,["new chat","新建任务","新聊天","新对话","发起新聊天"])}
 agentStop=nil
 if let field=el {var parent:AXUIElement?=field;for _ in 0..<3 {guard let n=parent else{break};if let stop=descendants(n).first(where:{str($0,"AXRole")=="AXButton" && named($0,["stop","stop generating","stop response","停止","停止生成","停止回复"]) && attr($0,"AXEnabled") as? Bool==true}){agentStop=stop;break};parent=element(n,"AXParent")}}
 var tasks:[[String:String]]=[];var current="";var taskTitle=""
 if isAgent,let win=win {
  tasks=agentTasks(known,win,nodes)
  let selected=tasks.filter{t in guard let n=taskElements[t["id"] ?? ""] else{return false};return attr(n,"AXSelected") as? Bool==true || (!pageID.isEmpty && axURL(n)==pageID)}
  if selected.count==1 {current=selected[0]["id"]!;taskTitle=selected[0]["title"]!}
  if current.isEmpty && ["workbuddy","codex"].contains(known){let observed=known=="workbuddy" ? workbuddyTaskTitle(win,nodes):nodes.first{str($0,"AXRole")=="AXWebArea"}.map{str($0,"AXTitle")} ?? "";let matches=tasks.filter{$0["title"]==observed};if matches.count==1 && !ambiguousTaskTitles.contains(observed){current=matches[0]["id"]!;taskTitle=observed}}
  if current.isEmpty,let field=el,known=="workbuddy" {let words=nodes.filter{str($0,"AXRole")=="AXStaticText"}.map{str($0,"AXValue")}.joined().replacingOccurrences(of:" ",with:"");if words.contains("我帮你") && words.contains("办公") && words.contains("开发"){current=taskHandle(known,win,field);taskTitle="新建任务"}}
  if current.isEmpty,let field=el,let pending=pendingNewConversation,pending.app==known,equal(pending.window,win),(pending.title != titleKey || !equal(pending.field,field)),(agentText(known,field) ?? "?").trimmingCharacters(in:.whitespacesAndNewlines).isEmpty {activeNewConversation=NewConversationProof(app:known,window:win,title:titleKey,field:field,id:pending.id);pendingNewConversation=nil}
  if current.isEmpty,let proof=activeNewConversation,proof.app==known,equal(proof.window,win),proof.title==titleKey,equal(proof.field,el){current=proof.id;taskTitle="新对话"}
  // A confirmed blank homepage is a real current conversation, not invented history.
  if current.isEmpty,let field=el,let u=URL(string:pageID),["/","/app"].contains(u.path){current=taskHandle(known,win,field);taskTitle="新对话"}
 }
 let conversationKey=known+"/"+pageID+"/"+current
 if let proof=reviewDocumentTarget,windowChanged || proof.conversation != conversationKey || proof.document != reviewDocumentLabel(proof.field) || !nodes.contains(where:{equal($0,proof.field)}) || (focused != nil && !equal(focused,proof.field) && !descendants(proof.field).contains(where:{equal($0,focused)})) {reviewDocumentTarget=nil;el=isAgent ? primaryPrompt(known,nodes,focused):focused}
 if windowChanged || titleKey != lastTitle || conversationKey != lastConversation || !equal(el,lastElement) {focusID=UUID().uuidString}
 lastConversation=conversationKey;lastElement=el;lastWindow=win;lastApp=bundle;lastTitle=titleKey;agentPageIdentity=pageID
 let locked=(CGSessionCopyCurrentDictionary() as? [String:Any])?["CGSSessionScreenIsLocked"] as? Bool ?? false
 let trusted=AXIsProcessTrusted();let names=["codex":"Codex","workbuddy":"WorkBuddy","chatgpt":"ChatGPT","gemini":"Gemini","wps":"WPS"]
 var result:[String:Any]=["locked":locked,"permission":trusted,"device":Host.current().localizedName ?? "Mac","app":known,"appName":names[known] ?? "Mac 应用","window":windowID,"target":focusID,"windowTitle":"","text":"","editable":false,"textKnown":false,"selection":[0,0],"capabilities":[]]
 guard trusted,!locked,known != "unknown",let win=win else{return result}
 result["windowTitle"]=str(win,"AXTitle");result["pageIdentity"]=pageID
 var caps=["pointer","escape"]
 if isAgent {result["tasks"]=tasks.map{task -> [String:Any] in var out:[String:Any]=task;let node=taskElements[task["id"] ?? ""];out["selectable"]=node.map{!axURL($0).isEmpty || !str($0,"AXIdentifier").isEmpty}==true || !ambiguousTaskTitles.contains(task["title"] ?? "");return out};result["taskTitle"]=taskTitle;if !current.isEmpty{result["taskId"]=current};caps += ["task-list"];if !tasks.isEmpty{caps += ["switch-task"]};if agentNew != nil {caps += ["new-task"]};if agentStop != nil{caps += ["agent-stop"]};if tasks.first(where:{$0["id"]==current})?["status"]=="needs-input"{result["execution"]=["status":"needs-input"]}else if agentStop != nil || tasks.first(where:{$0["id"]==current})?["status"]=="running"{result["execution"]=["status":"running"]}}
 if let pos=CGEvent(source:nil)?.location {let rect=pointerDisplay(win);result["pointer"]=["x":max(0,min(1,(pos.x-rect.minX)/rect.width)),"y":max(0,min(1,(pos.y-rect.minY)/rect.height))]}
 let reviews=editReviews(known,nodes)
 if !reviews.isEmpty{result["editReviews"]=reviews;caps += ["agent-review"]}
 let selectionMenu=selectionActions(known,nodes,el)
 if !selectionMenu.isEmpty{result["selectionActions"]=selectionMenu;caps += ["agent-selection"]}
 result["capabilities"]=caps;guard let el=el else{return result}
 let role=str(el,"AXRole");guard str(el,"AXSubrole") != "AXSecureTextField",role != "AXSecureTextField" else{return result}
 let text=known=="workbuddy" ? workbuddyText(el):isAgent ? agentText(known,el):attr(el,"AXValue") as? String;let textRole=["AXTextArea","AXTextField","AXComboBox"].contains(role)
 let editable=textRole && text != nil && settable(el,"AXValue") && (!isAgent || !current.isEmpty)
 if known=="codex",!current.isEmpty,result["execution"]==nil {
  let status=tasks.first(where:{$0["id"]==current})?["status"] ?? "unknown"
  if status != "unknown"{result["execution"]=["status":status]}
 }
 if let proof=reviewDocumentTarget,equal(proof.field,el){result["editorContext"]="review-document/"+proof.id;result["editorLabel"]="修改原文"}
 if known=="codex",named(el,["edit instruction"]){result["editorContext"]="selection-edit/"+focusID;result["editorLabel"]="Edit · 选区修改指令"}
 result["editable"]=editable;result["textKnown"]=textRole && text != nil;result["text"]=textRole ? String((text ?? "").prefix(60000)):"";result["selection"]=selection(el) ?? [0,0];result["subapp"]=known=="wps" ? subapp(str(win,"AXTitle")):""
 if editable {caps += ["replace-text","insert-text","select-all","copy","cut","paste","delete","undo","redo"]}
 if isAgent && editable && reviewDocumentTarget==nil,let button=submitButton(el) {
  caps += ["agent-submit"]
  if known=="codex",let kind=labels(button).compactMap({composerSubmissionKind($0)}).first {result["submitAction"]=composerAction(button,kind,el)}
 }
 if known=="codex",editable,reviewDocumentTarget==nil {
  let steer=descendants(scopedComposerRegion(el)).filter{str($0,"AXRole")=="AXButton" && named($0,["steer","steer now"])}
  result["composerActions"]=steer.prefix(10).map{composerAction($0,"steer",el)}
  if steer.contains(where:{attr($0,"AXEnabled") as? Bool==true}){caps += ["agent-action"]}
 }
 if ["codex","chatgpt","gemini"].contains(known) && editable && reviewDocumentTarget==nil && uploadButton(known,el) != nil {caps += ["agent-attach"];result["attachments"]=attachmentReadyNames(known,el)}
 // WorkBuddy retains its existing native attachment integration.
 if known=="workbuddy" && editable {caps += ["agent-attach","workbuddy-attach"];result["attachments"]=attachmentNames(el);if caps.contains("agent-submit"){caps += ["workbuddy-submit"]}}
 if known=="wps" && subapp(str(win,"AXTitle"))=="writer" && ["AXTextArea","AXSplitGroup"].contains(role){caps += ["insert-text","select-all","copy","cut","paste","delete","undo","redo","save","bold","italic","underline","align-left","align-center","align-right"]}
 result["capabilities"]=Array(Set(caps)).sorted();return result
}
// Registered, explicit attachment adoption. No step below presses an Agent Send button.
struct AgentUpload {
 let id:String;let app:String;let bundle:String;let window:AXUIElement;var field:AXUIElement;var root:AXUIElement
 let page:String;let title:String;let target:String;let windowID:String;let base:String;let snapshot:[String:Any]
 let paths:[String];let aliases:[URL];let created:Date
 var phase="start";var phaseStarted=Date();var beforeCards:[String]=[];var menuReopens=0;var index=0;var error="";var diagnostic="";var stableSince:Date?=nil;var panel:AXUIElement?=nil
}
var agentUpload:AgentUpload?=nil
var attachmentAliases:[String:[String:String]]=[:]
func shortAttachmentName(_ path:String)->String {"ia"+SHA256.hash(data:Data(path.utf8)).prefix(4).map{String(format:"%02x",$0)}.joined()+"."+URL(fileURLWithPath:path).pathExtension.lowercased()}
func uploadButton(_ app:String,_ field:AXUIElement)->AXUIElement? {
 if app=="codex" && named(field,["edit instruction"]){return nil}
 let names=app=="gemini" ? ["upload & tools"]:app=="chatgpt" ? ["添加文件等内容","add files and more"]:["add files and more"]
 var p:AXUIElement?=field
 for _ in 0..<7 {guard let n=p,!equal(n,agentRoot) else{break};let found=descendants(n).filter{["AXButton","AXPopUpButton"].contains(str($0,"AXRole")) && named($0,names)};if found.count==1{return found[0]};if found.count>1{return nil};p=element(n,"AXParent")};return nil
}
func attachmentComposer(_ app:String,_ field:AXUIElement)->AXUIElement? {
 guard let button=uploadButton(app,field) else{return nil};var p:AXUIElement?=field
 for _ in 0..<7 {guard let n=p,!equal(n,agentRoot) else{break};if descendants(n).contains(where:{equal($0,button)}){return n};p=element(n,"AXParent")};return nil
}
func pressAX(_ n:AXUIElement)->Bool {var values:CFArray?;guard AXUIElementCopyActionNames(n,&values) == .success else{return false};let actions=values as? [String] ?? [];if !actions.contains("AXPress"),actions.contains("AXShowMenu"),NSWorkspace.shared.frontmostApplication?.bundleIdentifier=="com.openai.codex",str(n,"AXRole")=="AXButton" {
 // This observed Codex WebKit button exposes AXShowMenu but only its focused
 // Space activation opens the file controls. Never type into an unverified field.
 guard AXUIElementSetAttributeValue(n,"AXFocused" as CFString,kCFBooleanTrue) == .success else{return false}
 RunLoop.current.run(until:Date(timeIntervalSinceNow:0.1))
 let (app,_,focused)=front();guard app?.bundleIdentifier=="com.openai.codex",equal(focused,n) else{return false};key(49);return true
 }
 let action=actions.contains("AXPress") ? "AXPress":actions.contains("AXShowMenu") ? "AXShowMenu":"";return !action.isEmpty && AXUIElementPerformAction(n,action as CFString) == .success}
func pressAttachmentChoice(_ n:AXUIElement,_ job:AgentUpload)->Bool {
 if ["chatgpt","codex"].contains(job.app),str(n,"AXRole")=="AXButton",let bounds=frame(n) {
  // Use the actual accessible button geometry and a fresh OS hit-test, never guessed coordinates.
  let p=CGPoint(x:bounds.midX,y:bounds.midY);var hit:AXUIElement?
  let (app,win,_)=front()
  if app?.bundleIdentifier==job.bundle,equal(win,job.window),AXUIElementCopyElementAtPosition(system,Float(p.x),Float(p.y),&hit) == .success,let hit=hit,(equal(hit,n)||parentContains(hit,n)) {
   for type in [CGEventType.leftMouseDown,.leftMouseUp] {CGEvent(mouseEventSource:nil,mouseType:type,mouseCursorPosition:p,mouseButton:.left)?.post(tap:.cghidEventTap)}
   return true
  }
 }
 return pressAX(n)
}
func parentContains(_ child:AXUIElement,_ ancestor:AXUIElement)->Bool {var p:AXUIElement?=child;for _ in 0..<15{guard let n=p else{return false};if equal(n,ancestor){return true};p=element(n,"AXParent")};return false}
func uploadOwnerIssue(_ job:AgentUpload)->String {
 let (app,win,_)=front(includeFocus:false);guard AXIsProcessTrusted(),app?.bundleIdentifier==job.bundle,let win=win,(CGSessionCopyCurrentDictionary() as? [String:Any])?["CGSSessionScreenIsLocked"] as? Bool != true else{return "foreground"}
 if !equal(win,job.window) && !parentContains(win,job.window) {return "window"}
 guard str(job.window,"AXTitle").trimmingCharacters(in:CharacterSet(charactersIn:"* "))==job.title else{return "title"}
 // A native modal temporarily hides Chrome's web subtree. Only our owned system sheets
 // may suspend the page read; the visible page is checked again before upload acceptance.
 let ownedSheet = !equal(win,job.window) && parentContains(win,job.window) && ["open-panel","GoToWindow"].contains(str(win,"AXIdentifier"))
 // Two blank tabs can have the same URL/title. Keep the original AX page identity;
 // only the editor inside it may remount during a verified upload.
 if !job.page.isEmpty && !ownedSheet {guard agentPage(job.window).map({axURL($0)==job.page && equal($0,job.root)})==true else{return "page"}}
 return ""
}
func uploadOwnerValid(_ job:AgentUpload)->Bool {uploadOwnerIssue(job).isEmpty}
func attachmentCards(_ app:String,_ field:AXUIElement)->[String] {
 if app=="workbuddy" {return attachmentNames(field)}
 guard let composer=attachmentComposer(app,field) else{return []}
 let excluded=descendants(field)
 let nodes=descendants(composer).filter{n in !excluded.contains(where:{equal($0,n)})}
 // Only removal controls are proof of attachment cards; filename mentions in prose never count.
 let namedCards:[String]=nodes.filter{str($0,"AXRole")=="AXButton"}.compactMap{n in
  let label=str(n,"AXTitle");let lower=label.lowercased()
  if label.hasPrefix("移除“"),label.hasSuffix("”"){return String(label.dropFirst(3).dropLast())}
  for prefix in ["close ","remove attachment ","remove file ","remove ","删除附件 ","移除文件 ","移除 "] where lower.hasPrefix(prefix) {return String(label.dropFirst(prefix.count))}
  return nil
 }
 // Gemini exposes image previews with an AXURL blob identity, not their filename.
 // Only observed attachment images inside this composer count, never page illustrations.
 let imageCards=app=="gemini" ? nodes.filter{str($0,"AXRole")=="AXImage" && named($0,["attachment"]) && axURL($0).hasPrefix("blob:https://gemini.google.com/")}.map{"image:"+axURL($0)}:[]
 return namedCards+imageCards
}
func attachmentReadyNames(_ app:String,_ field:AXUIElement)->[String] {
 if app=="workbuddy" {return attachmentNames(field)}
 let cards=attachmentCards(app,field);let aliases=attachmentAliases[focusID] ?? [:]
 return resolvedAttachmentNames(cards,aliases)
}
func resolvedAttachmentNames(_ cards:[String],_ aliases:[String:String])->[String] {
 // Foreign cards must remain visible to the final manifest check, never be silently omitted.
 cards.map{card in aliases.first{_,alias in card==alias || card==URL(fileURLWithPath:alias).deletingPathExtension().lastPathComponent}?.key ?? "unverified:"+card}
}
func transportFilenameMatches(_ candidate:String,_ alias:URL)->Bool {
 if candidate==alias.lastPathComponent || candidate==alias.deletingPathExtension().lastPathComponent{return true}
 // ChatGPT Work keeps uploads in its file library and adds a visible numeric suffix on repeat.
 let stem=NSRegularExpression.escapedPattern(for:alias.deletingPathExtension().lastPathComponent),ext=NSRegularExpression.escapedPattern(for:alias.pathExtension)
 return candidate.range(of:"^"+stem+" ?\\([0-9]{1,4}\\)\\."+ext+"$",options:.regularExpression) != nil
}
func uploadCardIdentity(_ job:AgentUpload)->String? {
 let cards=attachmentCards(job.app,job.field),original=URL(fileURLWithPath:job.paths[job.index]).lastPathComponent
 if let known=attachmentAliases[job.target]?[original],cards.contains(known){return known}
 let name=job.aliases[job.index].lastPathComponent,stem=job.aliases[job.index].deletingPathExtension().lastPathComponent
 if cards.contains(name){return name};if cards.contains(stem){return stem}
 let renamed=cards.filter{!job.beforeCards.contains($0) && transportFilenameMatches($0,job.aliases[job.index])}
 if renamed.count==1,job.beforeCards.allSatisfy({cards.contains($0)}){return renamed[0]}
 if job.app=="gemini",["png","jpg","jpeg","webp"].contains(job.aliases[job.index].pathExtension.lowercased()) {
  let fresh=cards.filter{!job.beforeCards.contains($0)}
  if fresh.count==1,fresh[0].hasPrefix("image:blob:https://gemini.google.com/"),job.beforeCards.allSatisfy({cards.contains($0)}){return fresh[0]}
 }
 return nil
}
func uploadedCardReady(_ job:AgentUpload)->Bool {
 guard uploadCardIdentity(job) != nil,let composer=attachmentComposer(job.app,job.field) else{return false}
 let nodes=descendants(composer)
 return !nodes.contains{n in let words=(labels(n)+[str(n,"AXValue").lowercased()]).joined(separator:" ");return str(n,"AXRole")=="AXProgressIndicator" || attr(n,"AXBusy") as? Bool==true || words.contains("uploading") || words.contains("正在上传") || words.contains("上传失败") || words.contains("upload failed")}
}
func uploadResponse(_ job:AgentUpload)->[String:Any] {
 if job.phase=="failed" {return ["ok":false,"outcome":"unknown","uploadId":job.id,"uploadStatus":"failed","error":job.error,"diagnostic":job.diagnostic]}
 if job.phase=="verified" {return ["ok":true,"outcome":"verified","uploadId":job.id,"uploadStatus":"verified"]}
 return ["ok":true,"outcome":"executed","uploadId":job.id,"uploadStatus":"pending","uploadPhase":job.phase]
}
func uploadFailure(_ message:String)->[String:Any] {guard var job=agentUpload else{return fail(message)};job.diagnostic=job.phase+":"+uploadOwnerIssue(job);job.phase="failed";job.error=message;agentUpload=job;return uploadResponse(job)}
func cancelAgentUpload() {
 if let job=agentUpload,!["verified","failed"].contains(job.phase){_ = uploadFailure("连接或控制已暂停，材料保留；请先核对电脑附件，不会自动提交")}
}
func uploadSnapshot()->[String:Any]? {
 guard let job=agentUpload,!["verified","failed"].contains(job.phase) else{return nil}
 guard Date().timeIntervalSince(job.created)<90,uploadOwnerValid(job) else{_ = uploadFailure("上传目标或连接已变化，材料已保留；未提交");return nil}
 var result=job.snapshot;result["attachmentTransfer"]="pending";result["capabilities"]=["agent-attach-status"];return result
}
func beginAgentUpload(_ s:[String:Any],_ paths:[String],_ base:String)->[String:Any] {
 if let job=agentUpload,!["verified","failed"].contains(job.phase) {if job.paths==paths && job.target==focusID{return uploadResponse(job)};return fail("另一组附件仍在核对，未重复上传")}
 guard let field=lastElement,let win=lastWindow,let root=agentRoot,let app=s["app"] as? String,base==s["text"] as? String,uploadButton(app,field) != nil,!paths.isEmpty else{return fail("附件入口或草稿已变化")}
 let materialRoot=URL(fileURLWithPath:FileManager.default.currentDirectoryPath).appendingPathComponent("artifacts/mac-bridge/materials").resolvingSymlinksInPath().standardizedFileURL.path+"/"
 guard paths.count<=10,Set(paths.map{URL(fileURLWithPath:$0).lastPathComponent}).count==paths.count,paths.allSatisfy({URL(fileURLWithPath:$0).resolvingSymlinksInPath().standardizedFileURL.path.hasPrefix(materialRoot) && FileManager.default.fileExists(atPath:$0)}) else{return fail("附件尚未校验，未打开选择器")}
 // Short transport aliases let truncated webpage labels remain verifiable, retaining original names on phone.
 var aliases:[URL]=[]
 do{for path in paths {let source=URL(fileURLWithPath:path),alias=source.deletingLastPathComponent().appendingPathComponent(shortAttachmentName(path));if !FileManager.default.fileExists(atPath:alias.path){try FileManager.default.copyItem(at:source,to:alias)};guard try Data(contentsOf:source)==Data(contentsOf:alias) else{return fail("附件副本校验失败")};aliases.append(alias)}}catch{return fail("附件准备失败，材料已保留")}
 let existing=attachmentCards(app,field),proof=attachmentProof[focusID] ?? [:],known=attachmentAliases[focusID] ?? [:]
 guard existing.allSatisfy({card in paths.contains{path in let original=URL(fileURLWithPath:path).lastPathComponent;guard proof[original]==path,let alias=known[original] else{return false};return card==alias||card==URL(fileURLWithPath:alias).deletingPathExtension().lastPathComponent}}) else{return fail("电脑已有未核对附件，请先核对；没有替换或提交")}
 var job=AgentUpload(id:UUID().uuidString,app:app,bundle:lastApp,window:win,field:field,root:root,page:agentPageIdentity,title:lastTitle,target:focusID,windowID:windowID,base:base,snapshot:s,paths:paths,aliases:aliases,created:Date())
 while job.index<paths.count,proof[URL(fileURLWithPath:paths[job.index]).lastPathComponent]==paths[job.index],uploadedCardReady(job) {job.index+=1}
 if job.index==paths.count {job.phase="verified"}
 agentUpload=job;return uploadResponse(job)
}
func attachmentChoiceNames(_ app:String)->[String] {
 app=="gemini" ? ["upload files. documents, data, code files"]:app=="chatgpt" ? ["添加照片和文件 从计算机上传","add photos & files","upload from computer"]:["files and folders"]
}
func visibleAttachmentChoices(_ job:AgentUpload)->[AXUIElement] {
 descendants(job.root).filter{["AXButton","AXMenuItem"].contains(str($0,"AXRole")) && named($0,attachmentChoiceNames(job.app)) && frame($0) != nil}
}
func stepAgentUpload(_ m:[String:Any])->[String:Any] {
 guard var job=agentUpload,m["uploadId"] as? String==job.id,m["target"] as? String==job.target,m["window"] as? String==job.windowID else{return fail("上传回执不属于此目标")}
 if ["failed","verified"].contains(job.phase){return uploadResponse(job)}
 guard Date().timeIntervalSince(job.created)<90,uploadOwnerValid(job) else{return uploadFailure("上传目标已变化或超时，材料保留；未提交")}
 let (_,frontWindow,_)=front();guard let frontWindow=frontWindow else{return uploadFailure("上传窗口不可用，未提交")}
 let oldPhase=job.phase
 if job.phase != "uploading" && Date().timeIntervalSince(job.phaseStarted)>12 {return uploadFailure("附件选择器未完成，请在电脑关闭或核对后重试；材料已保留")}
 switch job.phase {
 case "start":
  job.beforeCards=attachmentCards(job.app,job.field);job.menuReopens=0
  guard equal(frontWindow,job.window) else{return uploadFailure("附件窗口已变化")}
  if visibleAttachmentChoices(job).isEmpty {guard let button=uploadButton(job.app,job.field),pressAX(button) else{return uploadFailure("无法打开已登记的附件入口")}}
  job.phase="menu"
 case "menu":
  if str(frontWindow,"AXIdentifier")=="open-panel" {job.panel=frontWindow;job.phase="goto";break}
  if !job.page.isEmpty,let page=agentPage(job.window){job.root=page;agentRoot=page}
  let nodes=descendants(job.root),items=visibleAttachmentChoices(job)
  if nodes.contains(where:{str($0,"AXSubrole")=="AXApplicationDialog"}) {return uploadFailure("请先在电脑完成上传确认，材料已保留；未提交")}
  if items.count==1 {if pressAttachmentChoice(items[0],job){job.phase="panel"}}
  else if items.isEmpty,Date().timeIntervalSince(job.phaseStarted)>1,job.menuReopens<2,equal(frontWindow,job.window),let button=uploadButton(job.app,job.field) {
   // Only reopen the registered chooser before any file is selected. Never re-upload a file.
   if pressAX(button){job.menuReopens+=1;job.phaseStarted=Date()}
  }
 case "panel":
  if str(frontWindow,"AXIdentifier")=="open-panel" {job.panel=frontWindow;job.phase="goto"}
 case "goto":
  guard equal(frontWindow,job.panel),str(frontWindow,"AXIdentifier")=="open-panel" else{return uploadFailure("文件选择器已变化")};key(5,[.maskCommand,.maskShift]);job.phase="path"
 case "path":
  guard str(frontWindow,"AXIdentifier")=="GoToWindow",parentContains(frontWindow,job.window) else{break}
  guard let field=descendants(frontWindow).first(where:{str($0,"AXIdentifier")=="PathTextField"}),AXUIElementSetAttributeValue(field,"AXValue" as CFString,job.aliases[job.index].path as CFString) == .success,AXUIElementSetAttributeValue(field,"AXFocused" as CFString,kCFBooleanTrue) == .success,str(field,"AXValue")==job.aliases[job.index].path else{return uploadFailure("文件路径未确认，未选择其他文件")}
  // Return is limited to the verified native Go-to-path dialog, never an Agent composer.
  key(36);job.phase="selected"
 case "selected":
  guard equal(frontWindow,job.panel),str(frontWindow,"AXIdentifier")=="open-panel" else{break}
  let nodes=descendants(frontWindow),name=job.aliases[job.index].lastPathComponent
  let rows=nodes.filter{str($0,"AXRole")=="AXRow" && attr($0,"AXSelected") as? Bool==true}
  guard rows.count==1,descendants(rows[0]).contains(where:{str($0,"AXValue")==name || str($0,"AXTitle")==name}),let button=nodes.first(where:{str($0,"AXIdentifier")=="OKButton"}),attr(button,"AXEnabled") as? Bool==true,pressAX(button) else{return uploadFailure("所选文件或格式未通过核对，未打开其他材料")}
  job.phase="uploading"
 case "uploading":
  guard equal(frontWindow,job.window) else{break}
  // Web upload can remount the editor. Rebind only inside this already verified
  // conversation, with the exact same draft; do not treat a detached AX node as completion.
  let currentRoot=job.page.isEmpty ? job.window:agentPage(job.window)
  guard let currentRoot=currentRoot,let currentField=primaryPrompt(job.app,descendants(currentRoot),nil) else{break}
  guard agentText(job.app,currentField)==job.base else{return uploadFailure("上传后草稿已变化，材料保留；未提交")}
  job.root=currentRoot;job.field=currentField;agentRoot=currentRoot;lastElement=currentField
  guard agentText(job.app,job.field)==job.base else{return uploadFailure("上传期间电脑草稿已变化，未提交；请先核对内容")}
  if uploadedCardReady(job) {
   if job.stableSince==nil {job.stableSince=Date()}
   if Date().timeIntervalSince(job.stableSince!)>=0.7 {
    let original=URL(fileURLWithPath:job.paths[job.index]).lastPathComponent
    attachmentProof[job.target,default:[:]][original]=job.paths[job.index];attachmentAliases[job.target,default:[:]][original]=uploadCardIdentity(job)
    job.index+=1;job.stableSince=nil;job.phase=job.index==job.paths.count ? "verified":"start"
   }
  }else{job.stableSince=nil}
 default:return uploadFailure("上传阶段不可用，未提交")
 }
 if job.phase != oldPhase {job.phaseStarted=Date()}
 agentUpload=job;return uploadResponse(job)
}

func documentTextPatch(_ base:String,_ text:String)->(CFRange,String) {
 let a=Array(base.utf16),b=Array(text.utf16);var start=0,end=0
 while start<min(a.count,b.count) && a[start]==b[start]{start+=1}
 if start>0 && start<a.count && a[start]>=0xDC00 && a[start]<=0xDFFF{start-=1}
 while end<min(a.count,b.count)-start && a[a.count-end-1]==b[b.count-end-1]{end+=1}
 if end>0 && a.count-end<a.count && a[a.count-end]>=0xDC00 && a[a.count-end]<=0xDFFF{end-=1}
 return (CFRange(location:start,length:a.count-start-end),String(decoding:b[start..<(b.count-end)],as:UTF16.self))
}
func fail(_ message:String)->[String:Any] { ["ok":false,"error":message,"outcome":"rejected"] }
func key(_ code:CGKeyCode,_ flags:CGEventFlags=[]) { for down in [true,false] {let e=CGEvent(keyboardEventSource:nil,virtualKey:code,keyDown:down);e?.flags=flags;e?.post(tap:.cghidEventTap)} }
func release() {appSwitcher.cancel();releaseMouse()}
func releaseMouse() {if held {let p=CGEvent(source:nil)?.location ?? .zero;CGEvent(mouseEventSource:nil,mouseType:.leftMouseUp,mouseCursorPosition:p,mouseButton:.left)?.post(tap:.cghidEventTap)};held=false}
func pointer(_ m:[String:Any])->[String:Any] {
  guard let x=m["x"] as? Double,let y=m["y"] as? Double,x.isFinite,y.isFinite,x>=0,x<=1,y>=0,y<=1 else{return fail("无效指针位置")};guard let win=lastWindow else{return fail("窗口位置不可读")};let bounds=pointerDisplay(win);let p=CGPoint(x:bounds.minX+x*(bounds.width-1),y:bounds.minY+y*(bounds.height-1));let action=m["action"] as? String ?? ""
  func mouse(_ type:CGEventType,_ button:CGMouseButton = .left,_ clicks:Int64=1){let e=CGEvent(mouseEventSource:nil,mouseType:type,mouseCursorPosition:p,mouseButton:button);e?.setIntegerValueField(.mouseEventClickState,value:clicks);e?.post(tap:.cghidEventTap)}
  switch action {case "move":mouse(held ? .leftMouseDragged:.mouseMoved);case "down":held=true;mouse(.leftMouseDown);case "up":mouse(.leftMouseUp);held=false;case "cancel":release();case "left","double":mouse(.leftMouseDown,.left,action=="double" ? 2:1);mouse(.leftMouseUp,.left,action=="double" ? 2:1);case "right":mouse(.rightMouseDown,.right);mouse(.rightMouseUp,.right);case "scroll":let dy=m["dy"] as? Double ?? 0;guard dy.isFinite else{return fail("无效滚动")};CGEvent(scrollWheelEvent2Source:nil,units:.pixel,wheelCount:1,wheel1:Int32(max(-600,min(600,-dy))),wheel2:0,wheel3:0)?.post(tap:.cghidEventTap);default:return fail("未知指针操作")};return ["ok":true,"outcome":"executed"]
}
func descendants(_ root:AXUIElement)->[AXUIElement] {var queue=[root],out:[AXUIElement]=[];while !queue.isEmpty && out.count<3200 {let n=queue.removeFirst();out.append(n);queue.append(contentsOf:(attr(n,"AXChildren") as? [AXUIElement] ?? []).prefix(100))};return out}
func visibleTexts(_ root:AXUIElement,excluding:AXUIElement)->[String] {let excluded=descendants(excluding);return descendants(root).filter{n in str(n,"AXRole")=="AXStaticText" && !excluded.contains(where:{equal($0,n)})}.map{str($0,"AXValue")}.filter{!$0.isEmpty}}
func workbuddyTasks(_ win:AXUIElement,_ nodes:[AXUIElement])->[[String:String]] {guard let rect=frame(win) else{return []};taskElements.removeAll();var out:[[String:String]]=[];for n in nodes {let title=str(n,"AXTitle");guard str(n,"AXRole")=="AXButton",let r=frame(n),r.minX<rect.minX+rect.width*0.25,r.minY>rect.minY+rect.height*0.3,!title.isEmpty,!title.contains("http"),title.count<160,!title.hasPrefix("查看更多"),!["收起","关闭","立即领取","立即前往","Buddy加油站","成长计划"].contains(title) else{continue};let identity=str(n,"AXIdentifier");let occurrence=out.filter{$0["title"]==title}.count;let taskKey=identity.isEmpty ? title+"#"+String(occurrence):identity;let key=taskKeys[taskKey] ?? UUID().uuidString;taskKeys[taskKey]=key;taskElements[key]=n;out.append(["id":key,"title":title]);if out.count>=20 {break}};return out}
func workbuddyTaskTitle(_ win:AXUIElement,_ nodes:[AXUIElement])->String {guard let rect=frame(win) else{return ""};return nodes.first{n in guard str(n,"AXRole")=="AXStaticText",let r=frame(n) else{return false};return r.minX>rect.minX+rect.width*0.25 && r.minY<rect.minY+100 && !str(n,"AXValue").isEmpty}.map{str($0,"AXValue")} ?? "新建任务"}
func attachmentNames(_ field:AXUIElement)->[String] {Array(Set(descendants(field).filter{str($0,"AXRole")=="AXButton"}.map{str($0,"AXTitle")}.filter{$0.range(of:"\\.(pdf|docx?|pptx?|xlsx?|txt|md|csv|png|jpe?g|webp|json)$",options:[.regularExpression,.caseInsensitive]) != nil})).sorted()}
func workbuddyText(_ field:AXUIElement)->String? {guard var text=attr(field,"AXValue") as? String else{return nil};for name in attachmentNames(field) {text=text.replacingOccurrences(of:"\n"+name,with:"")};let clean=text.replacingOccurrences(of:"\u{FEFF}",with:"").replacingOccurrences(of:"\u{200B}",with:"").trimmingCharacters(in:.newlines);let compact=clean.components(separatedBy:.whitespacesAndNewlines).joined();if submitButton(field)==nil && compact=="今天帮你做些什么？@添加上下文，/调用技能与指令" {return ""};return clean}
func composerLabels(_ field:AXUIElement)->[String] {var root=field;for _ in 0..<3 {if let p=element(root,"AXParent"){root=p}};return descendants(root).flatMap{[str($0,"AXTitle"),str($0,"AXValue"),str($0,"AXDescription")]}}
func keyboardTargetIsCurrent()->Bool {let (app,win,field)=front();return app?.bundleIdentifier==lastApp && equal(win,lastWindow) && equal(field,lastElement) && (CGSessionCopyCurrentDictionary() as? [String:Any])?["CGSSessionScreenIsLocked"] as? Bool != true}
func focusVerifiedTarget()->Bool {guard let field=lastElement else{return false};if keyboardTargetIsCurrent(){return true};guard AXUIElementSetAttributeValue(field,"AXFocused" as CFString,kCFBooleanTrue) == .success else{return false};return keyboardTargetIsCurrent()}
@discardableResult func withPasteboard(_ write:()->Void)->Bool {guard keyboardTargetIsCurrent() else{return false};let board=NSPasteboard.general;let saved=(board.pasteboardItems ?? []).map{item -> NSPasteboardItem in let copy=NSPasteboardItem();for type in item.types {if let data=item.data(forType:type){copy.setData(data,forType:type)}};return copy};board.clearContents();write();board.setData(Data(),forType:NSPasteboard.PasteboardType("org.nspasteboard.TransientType"));let count=board.changeCount;let valid=keyboardTargetIsCurrent();if valid{key(9,.maskCommand);Thread.sleep(forTimeInterval:0.3)};if board.changeCount==count {board.clearContents();board.writeObjects(saved)};return valid}
@discardableResult func pasteText(_ text:String)->Bool {withPasteboard{NSPasteboard.general.setString(text,forType:.string)}}
@discardableResult func pasteURLs(_ urls:[URL])->Bool {withPasteboard{NSPasteboard.general.writeObjects(urls as [NSURL])}}
func handle(_ m:[String:Any])->[String:Any] {
 let op=m["op"] as? String ?? ""
 if op=="state" {if (CGSessionCopyCurrentDictionary() as? [String:Any])?["CGSSessionScreenIsLocked"] as? Bool == true {release()};return ["ok":true,"state":state()]}
 if op=="release" {cancelAgentUpload();release();return ["ok":true,"outcome":"executed"]}
 if op=="app-switch" {
  guard AXIsProcessTrusted() else{return fail("请在 Mac 辅助功能权限中开启 node")}
  guard (CGSessionCopyCurrentDictionary() as? [String:Any])?["CGSSessionScreenIsLocked"] as? Bool != true else{release();return fail("请先解锁 Mac")}
  if m["action"] as? String=="cancel" {appSwitcher.cancel()}
  else if m["action"] as? String=="next" {cancelAgentUpload();releaseMouse();appSwitcher.next()}
  else{return fail("未登记的切换操作")}
  return ["ok":true,"outcome":"executed"]
 }
 if appSwitcher.isActive {appSwitcher.cancel();return fail("应用切换已取消，请重新操作")}
 if op=="permissions" {return ["ok":true,"permission":AXIsProcessTrusted()]}
 if op=="activate" {guard let app=m["app"] as? String,let bundle=allowed[app] else{return fail("此应用尚未接入")};release();if let running=NSRunningApplication.runningApplications(withBundleIdentifier:bundle).first {let ok=running.activate(options:[.activateAllWindows]);return ["ok":ok,"outcome":ok ? "executed":"unknown"]};guard let url=NSWorkspace.shared.urlForApplication(withBundleIdentifier:bundle) else{return fail("Mac 尚未安装此应用")};let config=NSWorkspace.OpenConfiguration();config.activates=true;NSWorkspace.shared.openApplication(at:url,configuration:config,completionHandler:nil);return ["ok":true,"outcome":"executed"]}
 if op=="workbuddy-task" || op=="agent-task" {
  let s=state();guard s["permission"] as? Bool==true,s["locked"] as? Bool != true,["workbuddy","codex","chatgpt","gemini"].contains(s["app"] as? String ?? ""), (op != "workbuddy-task" || s["app"] as? String=="workbuddy"),m["target"] as? String==s["target"] as? String,m["window"] as? String==s["window"] as? String,let id=m["task"] as? String else{return fail("任务窗口已变化")}
  guard (s["capabilities"] as? [String] ?? []).contains(id=="new" ? "new-task":"switch-task") else{return fail("当前会话操作未接通")};let node=id=="new" ? agentNew:taskElements[id]
  guard let node=node,(id=="new" || taskExpectedLabels[id]==str(node,"AXTitle") && (!axURL(node).isEmpty || !str(node,"AXIdentifier").isEmpty || !ambiguousTaskTitles.contains(str(node,"AXTitle")))) else{return fail("任务入口已变化，请在 Mac 选择")}
  if id != "new",s["taskId"] as? String==id{return ["ok":true,"outcome":"verified","state":s]}
  release();let proof=lastWindow.map{NewConversationProof(app:s["app"] as? String ?? "",window:$0,title:lastTitle,field:lastElement,id:UUID().uuidString)}
  let activated=s["app"] as? String=="codex" ? pressAX(node):AXUIElementPerformAction(node,"AXPress" as CFString) == .success
  guard activated else{return fail("会话按钮未能激活，请在 Mac 核对；没有发送内容")}
  if id=="new" {pendingNewConversation=proof;activeNewConversation=nil}
  let deadline=Date(timeIntervalSinceNow:1.5);var next=s
  repeat {
   RunLoop.current.run(until:Date(timeIntervalSinceNow:0.08));next=state()
   guard next["app"] as? String==s["app"] as? String,next["window"] as? String==s["window"] as? String else{break}
   let current=next["taskId"] as? String ?? ""
   let matched=id=="new" ? !current.isEmpty && current != s["taskId"] as? String && next["text"] as? String=="":current==id
   if matched{return ["ok":true,"outcome":"verified","state":next]}
  }while Date()<deadline
  return ["ok":false,"outcome":"unknown","error":"未确认会话切换，请查看 Mac；不会自动重复点击","state":next]
 }
 if op=="pointer" {let (app,win,_)=front(includeFocus:false);guard (CGSessionCopyCurrentDictionary() as? [String:Any])?["CGSSessionScreenIsLocked"] as? Bool != true,AXIsProcessTrusted(),let app=app,let win=win,(allowed.values.contains(app.bundleIdentifier ?? "") || app.bundleIdentifier=="com.google.Chrome" && agentPage(win).map{axURL($0)==agentPageIdentity}==true),app.bundleIdentifier==lastApp,equal(win,lastWindow),str(win,"AXTitle").trimmingCharacters(in:CharacterSet(charactersIn:"* "))==lastTitle,m["window"] as? String==windowID else{release();return fail("控制窗口已变化")};return pointer(m)}
 if op=="agent-attach-status" {return stepAgentUpload(m)}
 let s=state();guard s["permission"] as? Bool == true else{return fail("请在 Mac 系统设置中允许 Input Agent Bridge 使用辅助功能")}
 guard s["app"] as? String != "unknown",m["window"] as? String == s["window"] as? String else{release();return fail("前台应用或窗口已变化，请重新选择目标")}
 if op != "pointer" {guard m["target"] as? String == s["target"] as? String else{return fail("输入目标已变化，内容已保留")}}
 let caps=s["capabilities"] as? [String] ?? []
 guard caps.contains(op) || op=="shortcut" else{return fail("当前目标不支持此操作")}
 if op=="agent-stop" {guard let button=agentStop else{return fail("当前没有可确认的停止操作")};let activated=s["app"] as? String=="codex" ? pressAX(button):AXUIElementPerformAction(button,"AXPress" as CFString) == .success;return ["ok":activated,"outcome":activated ? "executed":"unknown"]}
 if op=="agent-review" {
  guard let id=m["reviewId"] as? String,let actionId=m["actionId"] as? String,
   let review=(s["editReviews"] as? [[String:Any]])?.first(where:{$0["id"] as? String==id}),
   let action=(review["actions"] as? [[String:Any]])?.first(where:{$0["id"] as? String==actionId}),action["enabled"] as? Bool==true,
   let kind=action["kind"] as? String,let h=editReviewHandles.first(where:{$0.id==id && $0.owner==focusID}),
   reviewFingerprint(h.card,h.source)==h.fingerprint,let button=h.actions[kind],h.actionIDs[kind]==actionId else{return fail("修改建议已变化，请查看当前版本；未执行")}
  let previous=str(h.source,"AXValue")
  guard clickReviewControl(button) else{return fail("修改按钮被遮挡或不可用，未执行")}
  for _ in 0..<12 {
   RunLoop.current.run(until:Date(timeIntervalSinceNow:0.08));let next=state()
   guard next["app"] as? String==s["app"] as? String,next["window"] as? String==s["window"] as? String,next["taskId"] as? String==s["taskId"] as? String else{return ["ok":false,"outcome":"unknown","error":"目标已变化，操作不会重放","state":next]}
   if kind=="edit" {
    let (_,_,focused)=front()
    if equal(focused,h.source),reviewParts(h.card)==nil,let root=agentRoot,descendants(root).contains(where:{equal($0,h.source)}),settable(h.source,"AXValue") {
     reviewDocumentTarget=ReviewDocumentTarget(field:h.source,conversation:lastConversation,document:reviewDocumentLabel(h.source),id:UUID().uuidString)
     let ready=state();if ready["editable"] as? Bool==true{return ["ok":true,"outcome":"verified","state":ready]}
    }
   }
   else if let root=agentRoot,descendants(root).contains(where:{equal($0,h.source)}),reviewParts(h.card)==nil,str(h.source,"AXValue") != previous{return ["ok":true,"outcome":"verified","state":next]}
  }
  return ["ok":false,"outcome":"unknown","error":"正在核对修改结果；不会重复执行","state":state()]
 }
 if op=="agent-selection" {
  guard let id=m["actionId"] as? String,let action=(s["selectionActions"] as? [[String:Any]])?.first(where:{$0["id"] as? String==id}),action["enabled"] as? Bool==true,let h=selectionActionHandles.first(where:{$0.id==id && $0.owner==focusID}),selectedSignature(h.source)==h.signature else{return fail("选区或菜单已变化，未执行")}
  guard pressAX(h.node) else{return fail("未能打开当前选区操作")}
  for _ in 0..<12 {
   RunLoop.current.run(until:Date(timeIntervalSinceNow:0.08));let next=state()
   guard next["app"] as? String==s["app"] as? String,next["window"] as? String==s["window"] as? String,next["taskId"] as? String==s["taskId"] as? String else{return ["ok":false,"outcome":"unknown","error":"目标已变化，选区操作不会重放","state":next]}
   let (_,_,focused)=front()
   if next["editable"] as? Bool==true,equal(focused,lastElement),(h.kind=="edit" && next["editorContext"] != nil || h.kind=="add-to-chat" && next["editorContext"]==nil && (next["selectionActions"] as? [[String:Any]] ?? []).isEmpty){return ["ok":true,"outcome":"verified","state":next]}
  }
  return ["ok":false,"outcome":"unknown","error":"当前输入框尚未就绪，已保留内容；不会重复执行","state":state()]
 }
 if op=="agent-action" {
  guard s["app"] as? String=="codex",let id=m["actionId"] as? String,let action=(s["composerActions"] as? [[String:Any]])?.first(where:{$0["id"] as? String==id}),action["enabled"] as? Bool==true,let handle=composerActionHandles.first(where:{$0.id==id && $0.owner==focusID && $0.kind=="steer"}) else{return fail("此操作已变化，请查看当前界面；未执行")}
  guard pressAX(handle.node) else{return fail("未能激活当前 Steer 操作")}
  for _ in 0..<12 {RunLoop.current.run(until:Date(timeIntervalSinceNow:0.08));let next=state();guard next["target"] as? String==s["target"] as? String,next["window"] as? String==s["window"] as? String else{return ["ok":false,"outcome":"unknown","error":"操作后目标已变化，请核对；不会重试"]};if !(next["composerActions"] as? [[String:Any]] ?? []).contains(where:{$0["id"] as? String==id && $0["enabled"] as? Bool==true}){return ["ok":true,"outcome":"verified","state":next]}}
  return ["ok":false,"outcome":"unknown","error":"Steer 结果尚未确认，请查看 Mac；不会重复操作","state":state()]
 }
 if op=="replace-text" {
  guard let text=m["text"] as? String,text.utf16.count<=60000,let base=m["base"] as? String,base==s["text"] as? String,let el=lastElement else{return fail("电脑内容已变化，请先核对两端文字")}
  if let context=s["editorContext"] as? String,context.hasPrefix("review-document/") {
   guard focusVerifiedTarget() else{return fail("原文编辑焦点已变化，未写入")}
   if text==base{return ["ok":true,"outcome":"verified","state":s]}
   var (range,insertion)=documentTextPatch(base,text)
   if selection(el) != [range.location,range.length] {
    guard let v=AXValueCreate(.cfRange,&range),AXUIElementSetAttributeValue(el,"AXSelectedTextRange" as CFString,v) == .success,selection(el)==[range.location,range.length] else{return fail("未能核对原文光标位置，输入已保留")}
   }
   if insertion.isEmpty {key(51)}else{guard pasteText(insertion) else{return fail("原文编辑焦点已变化，未写入")}}
  } else if s["app"] as? String=="workbuddy" {
   // WorkBuddy's Electron editor needs real input events, not an AXValue-only DOM change.
   guard text.utf16.count<=2800 else{return fail("当前版本超过 2800 字会折叠为附件，请缩短输入后重试")}
   guard focusVerifiedTarget() else{return fail("实际输入焦点未确认，内容已保留")}
   if !attachmentNames(el).isEmpty {guard str(el,"AXValue").hasPrefix(base) else{return fail("附件与文字混排，请先在 WorkBuddy 核对编辑位置")};var range=CFRange(location:0,length:base.utf16.count);guard let value=AXValueCreate(.cfRange,&range),AXUIElementSetAttributeValue(el,"AXSelectedTextRange" as CFString,value) == .success else{return fail("此版本不能安全保留附件进行同步编辑")}}else{guard keyboardTargetIsCurrent() else{return fail("输入焦点已变化")};key(0,.maskCommand)};guard pasteText(text) else{return fail("输入焦点已变化，未粘贴")}
  }else if s["app"] as? String=="codex" {
   // Observed WebKit AXValue updates reset selection even when the setter reports
   // success. A verified native input event commits editor state before caret restore.
   guard focusVerifiedTarget() else{return fail("实际输入焦点未确认，内容已保留")}
   key(0,.maskCommand);guard pasteText(text) else{return fail("输入焦点已变化，未粘贴")}
  }else{let err=AXUIElementSetAttributeValue(el,"AXValue" as CFString,text as CFString);guard err == .success else{return fail("此输入框不接受同步写入，原文已保留")}}
  // AXValue replacement commonly resets the insertion point to zero. Restore the
  // projected phone range; older callers without a range finish at the inserted end.
  let range=(m["selection"] as? [Int]) ?? [text.utf16.count,0]
  if range.count==2,range[0]>=0,range[1]>=0,range[0]+range[1]<=text.utf16.count {var r=CFRange(location:range[0],length:range[1]);if let v=AXValueCreate(.cfRange,&r){_ = AXUIElementSetAttributeValue(el,"AXSelectedTextRange" as CFString,v)}}
  var next=state();for _ in 0..<12 {if next["text"] as? String==text && (s["app"] as? String != "codex" || next["selection"] as? [Int]==range) || next["target"] as? String != s["target"] as? String {break};Thread.sleep(forTimeInterval:0.025);next=state()};let verified=next["target"] as? String == s["target"] as? String && next["text"] as? String == text && (s["app"] as? String != "codex" || next["selection"] as? [Int]==range)
  return ["ok":verified,"outcome":verified ? "verified":"unknown","error":verified ? "":"文字或光标未能读回，请查看 Mac；不会自动重试","state":next]
 }
 if op=="workbuddy-attach" || op=="agent-attach" {
  if s["app"] as? String != "workbuddy",op=="agent-attach",let paths=m["paths"] as? [String],let base=m["base"] as? String{return beginAgentUpload(s,paths,base)}
  guard s["app"] as? String=="workbuddy",let field=lastElement,let paths=m["paths"] as? [String],paths.count<=10,let base=m["base"] as? String,base==s["text"] as? String else{return fail("附件目标或草稿已变化")}
  let urls=paths.map{URL(fileURLWithPath:$0)}
  let materialRoot=URL(fileURLWithPath:FileManager.default.currentDirectoryPath).appendingPathComponent("artifacts/mac-bridge/materials").resolvingSymlinksInPath().standardizedFileURL.path+"/"
  guard urls.allSatisfy({$0.resolvingSymlinksInPath().standardizedFileURL.path.hasPrefix(materialRoot) && FileManager.default.fileExists(atPath:$0.path)}) else{return fail("附件尚未完成校验")}
  guard focusVerifiedTarget() else{return fail("实际输入焦点未确认，内容已保留")}
  let presentBefore=attachmentNames(field);let requested=urls.map{$0.lastPathComponent}
  guard presentBefore.allSatisfy({name in requested.contains(name) && urls.contains{url in url.lastPathComponent==name && attachmentProof[focusID]?[name]==url.path}}) else{return fail("WorkBuddy 还有手机未登记的附件，请先核对")}
  let missing=urls.filter{!presentBefore.contains($0.lastPathComponent)};if !missing.isEmpty {guard pasteURLs(missing) else{return fail("输入焦点已变化，未粘贴附件")}}
  let names=urls.map{$0.lastPathComponent};let present=attachmentNames(field)
  let verified=names.allSatisfy{present.contains($0)}
  if verified {attachmentProof[focusID]=Dictionary(uniqueKeysWithValues:urls.map{($0.lastPathComponent,$0.path)});if attachmentProof.count>32{attachmentProof=attachmentProof.filter{$0.key==focusID}}}
  return ["ok":verified,"outcome":verified ? "verified":"unknown","error":verified ? "":"WorkBuddy 未回读全部附件，请在电脑添加或检查附件；不会自动提交","state":state()]
 }
 if op=="workbuddy-submit" || op=="agent-submit" {
  guard ["workbuddy","codex","chatgpt","gemini"].contains(s["app"] as? String ?? ""),(op != "workbuddy-submit" || s["app"] as? String=="workbuddy"),let field=lastElement,let win=agentRoot,let base=m["base"] as? String,!base.isEmpty,base==s["text"] as? String,let names=m["names"] as? [String],let button=submitButton(field) else{return fail("任务尚未就绪，请核对电脑输入和发送按钮")}
  if s["app"] as? String=="codex" {guard let current=s["submitAction"] as? [String:Any],m["actionId"] as? String==current["id"] as? String else{return fail("发送操作已变化，请核对当前按钮后重试")}}
  let present=attachmentReadyNames(s["app"] as? String ?? "",field);guard names.sorted()==present.sorted()else{return fail("附件未核对通过，输入已保留")}
  if !names.isEmpty {guard let paths=m["paths"] as? [String],paths.allSatisfy({attachmentProof[focusID]?[URL(fileURLWithPath:$0).lastPathComponent]==$0}) else{return fail("附件来源尚未核对，未发送")}}
  let before=visibleTexts(win,excluding:field).filter{$0==base}.count
  let activated=s["app"] as? String=="codex" ? pressAX(button):AXUIElementPerformAction(button,"AXPress" as CFString) == .success;guard activated else{return ["ok":false,"outcome":"unknown","error":"发送结果未知，请查看电脑；不会重试"]}
  for _ in 0..<20 {
   Thread.sleep(forTimeInterval:0.08)
   let next=state()
   if s["editorContext"] != nil,next["editorContext"]==nil,next["app"] as? String==s["app"] as? String,next["window"] as? String==s["window"] as? String,next["taskId"] as? String==s["taskId"] as? String{return ["ok":true,"outcome":"verified","state":next]}
   guard next["window"] as? String==s["window"] as? String,next["app"] as? String==s["app"] as? String,next["taskId"] as? String==s["taskId"] as? String else{return ["ok":false,"outcome":"unknown","error":"发送后目标已变化，请核对；不会重复发送","state":next]}
   if base.count>=4,let cleared=next["text"] as? String,cleared.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty,visibleTexts(win,excluding:lastElement ?? field).filter({$0==base}).count>before {return ["ok":true,"outcome":"verified","state":next]}
  }
  return ["ok":false,"outcome":"unknown","error":"尚未读回新任务消息，请在电脑核对；不会重复发送","state":state()]
 }
 if op=="insert-text" {guard let text=m["text"] as? String,text.utf16.count<=12000,focusVerifiedTarget(),pasteText(text) else{return fail("输入焦点未确认，内容已保留")};return ["ok":true,"outcome":"executed"]}


 if op=="shortcut" {
  if m["action"] as? String=="submit" {return fail("请使用已核对目标与附件的 Agent 发送操作")}

  guard let action=m["action"] as? String,caps.contains(action) else{return fail("当前编辑器不支持此快捷操作")}
  let keys:[String:(CGKeyCode,CGEventFlags)]=["escape":(53,[]),"select-all":(0,.maskCommand),"copy":(8,.maskCommand),"cut":(7,.maskCommand),"paste":(9,.maskCommand),"delete":(51,[]),"undo":(6,.maskCommand),"redo":(6,[.maskCommand,.maskShift]),"save":(1,.maskCommand),"bold":(11,.maskCommand),"italic":(34,.maskCommand),"underline":(32,.maskCommand),"align-left":(37,.maskCommand),"align-center":(14,.maskCommand),"align-right":(15,.maskCommand)]
  guard let (code,flags)=keys[action] else{return fail("未登记的快捷操作")};if action != "escape" {guard focusVerifiedTarget() else{return fail("实际输入焦点未确认，内容已保留")}};key(code,flags);return ["ok":true,"outcome":"executed"]
 }
 return fail("操作未接入")
}
while let line=readLine() {autoreleasepool {do {guard let data=line.data(using:.utf8),let m=try JSONSerialization.jsonObject(with:data) as? [String:Any] else{return};var r=handle(m);r["id"]=m["id"];let out=try JSONSerialization.data(withJSONObject:r,options:[.sortedKeys]);print(String(data:out,encoding:.utf8)!);fflush(stdout)}catch {print("{\"ok\":false,\"error\":\"无效请求\"}");fflush(stdout)}}}
release()
