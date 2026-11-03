import AppKit
import ApplicationServices

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
 if ["com.openai.codex","com.tencent.workbuddy.mac"].contains(app.bundleIdentifier ?? "") && !accessibilityPIDs.contains(app.processIdentifier) {_ = AXUIElementSetAttributeValue(ax,"AXManualAccessibility" as CFString,kCFBooleanTrue);accessibilityPIDs.insert(app.processIdentifier)}
 let windows=attr(ax,"AXWindows") as? [AXUIElement] ?? []
 return(app,element(ax,"AXFocusedWindow") ?? element(ax,"AXMainWindow") ?? windows.first,includeFocus ? (element(ax,"AXFocusedUIElement") ?? element(system,"AXFocusedUIElement")) : nil) }
func frame(_ el:AXUIElement)->CGRect? {guard let p=attr(el,"AXPosition"),let z=attr(el,"AXSize"),CFGetTypeID(p)==AXValueGetTypeID(),CFGetTypeID(z)==AXValueGetTypeID() else{return nil};var point=CGPoint.zero;var size=CGSize.zero;guard AXValueGetValue(p as! AXValue,.cgPoint,&point),AXValueGetValue(z as! AXValue,.cgSize,&size),size.width>1,size.height>1 else{return nil};return CGRect(origin:point,size:size)}
func subapp(_ title:String)->String { let t=title.lowercased(); if t.range(of:"\\.(docx?|odt)(?:$|[ —-])",options:.regularExpression) != nil{return "writer"};if t.range(of:"\\.(xlsx?|csv)(?:$|[ —-])",options:.regularExpression) != nil{return "sheet"};if t.range(of:"\\.(pptx?|odp)(?:$|[ —-])",options:.regularExpression) != nil{return "presentation"};return "unknown" }
func submitButton(_ field:AXUIElement)->AXUIElement? {
 var parent:AXUIElement?=field
 for _ in 0..<5 {
  guard let node=parent else{break}; var queue=[node];var visited=0
  while !queue.isEmpty && visited<100 {let child=queue.removeFirst();visited+=1
   if str(child,"AXRole")=="AXButton",attr(child,"AXEnabled") as? Bool == true {
    let labels=[str(child,"AXTitle"),str(child,"AXDescription"),str(child,"AXHelp")].map{$0.trimmingCharacters(in:.whitespaces).lowercased()}
    if labels.contains(where:{["send","send message","send prompt","发送","发送消息","提交"].contains($0)}) {return child}
   }
   if let children=attr(child,"AXChildren") as? [AXUIElement] {queue.append(contentsOf:children.prefix(40))}
  }
  parent=element(node,"AXParent")
 }
 return nil
}
func state()->[String:Any] {
 let (app,win,el)=front();let bundle=app?.bundleIdentifier ?? "";let known=allowed.first(where:{$0.value==bundle})?.key ?? "unknown";let titleKey=win.map{str($0,"AXTitle").trimmingCharacters(in:CharacterSet(charactersIn:"* "))} ?? "";let nodes=known=="workbuddy" ? win.map{descendants($0)} ?? []:[];let taskTitle=known=="workbuddy" ? win.map{workbuddyTaskTitle($0,nodes)} ?? "":"";let taskChanged=taskTitle != lastTaskTitle;lastTaskTitle=taskTitle
 if !equal(win,lastWindow)||bundle != lastApp||titleKey != lastTitle {releaseMouse();windowID=UUID().uuidString}
 if taskChanged || !equal(el,lastElement) || !equal(win,lastWindow)||bundle != lastApp||titleKey != lastTitle {focusID=UUID().uuidString}
 lastElement=el;lastWindow=win;lastApp=bundle;lastTitle=titleKey
 let locked=(CGSessionCopyCurrentDictionary() as? [String:Any])?["CGSSessionScreenIsLocked"] as? Bool ?? false;let trusted=AXIsProcessTrusted();var result:[String:Any] = ["locked":locked,"permission":trusted,"device":Host.current().localizedName ?? "Mac","app":known,"appName":known == "unknown" ? "选择 WorkBuddy、Codex 或 WPS" : (known == "codex" ? "Codex":known == "workbuddy" ? "WorkBuddy":"WPS Office"),"bundle":known == "unknown" ? "" : bundle,"window":windowID,"target":focusID,"windowTitle":"","text":"","editable":false,"textKnown":false,"selection":[0,0],"capabilities":[]]
 guard trusted,!locked,known != "unknown",let win=win else{return result}
 if known=="workbuddy" {let tasks=workbuddyTasks(win,nodes);result["tasks"]=tasks;result["taskTitle"]=taskTitle;let selected=tasks.filter{t in guard let id=t["id"],let n=taskElements[id] else{return false};return (attr(n,"AXSelected") as? Bool)==true};let matches=tasks.filter{$0["title"]==taskTitle};if selected.count==1 {result["taskId"]=selected[0]["id"]}else if matches.count==1 {result["taskId"]=matches[0]["id"]}}
 if let rect=frame(win),let pos=CGEvent(source:nil)?.location {result["pointer"]=["x":max(0,min(1,(pos.x-rect.minX)/rect.width)),"y":max(0,min(1,(pos.y-rect.minY)/rect.height))]};result["windowTitle"]=str(win,"AXTitle");result["capabilities"]=["pointer","escape"];guard let el=el else{return result}
 let role=str(el,"AXRole"),subrole=str(el,"AXSubrole"),title=str(win,"AXTitle");result["windowTitle"]=title;result["subapp"]=known == "wps" ? subapp(title):""
 guard subrole != "AXSecureTextField",role != "AXSecureTextField" else{return result}
 let text=known=="workbuddy" ? workbuddyText(el) : attr(el,"AXValue") as? String;if known=="workbuddy" {result["attachments"]=attachmentNames(el)};let textRole=["AXTextField","AXTextArea","AXComboBox"].contains(role)
 let editable=textRole && text != nil && settable(el,"AXValue") && (known != "workbuddy" || role=="AXTextArea");result["role"]=role;result["editable"]=editable;result["textKnown"]=textRole && text != nil;result["text"]=textRole ? String((text ?? "").prefix(60000)) : "";result["selection"]=selection(el) ?? [0,0]
 var caps=["pointer","escape"]
 if editable {caps += ["replace-text"]}
 if known=="codex" && editable && submitButton(el) != nil {caps += ["submit"]}
 if known=="workbuddy" && editable {caps += ["workbuddy-attach"];if submitButton(el) != nil {caps += ["workbuddy-submit"]}}
 if textRole && (known != "workbuddy" || editable) {caps += ["insert-text","select-all","copy","cut","paste","delete","undo","redo"]}
 // WPS editing surfaces often expose no readable AXValue. Explicit input stays separate from sync.
 if known == "wps" && subapp(title)=="writer" && ["AXTextArea","AXSplitGroup"].contains(role) { caps += ["insert-text","select-all","copy","cut","paste","delete","undo","redo","save","bold","italic","underline","align-left","align-center","align-right"] }
 result["capabilities"]=Array(Set(caps)).sorted();return result
}
func fail(_ message:String)->[String:Any] { ["ok":false,"error":message,"outcome":"rejected"] }
func key(_ code:CGKeyCode,_ flags:CGEventFlags=[]) { for down in [true,false] {let e=CGEvent(keyboardEventSource:nil,virtualKey:code,keyDown:down);e?.flags=flags;e?.post(tap:.cghidEventTap)} }
func release() {appSwitcher.cancel();releaseMouse()}
func releaseMouse() {if held {let p=CGEvent(source:nil)?.location ?? .zero;CGEvent(mouseEventSource:nil,mouseType:.leftMouseUp,mouseCursorPosition:p,mouseButton:.left)?.post(tap:.cghidEventTap)};held=false}
func pointer(_ m:[String:Any])->[String:Any] {
  guard let x=m["x"] as? Double,let y=m["y"] as? Double,x.isFinite,y.isFinite,x>=0,x<=1,y>=0,y<=1 else{return fail("无效指针位置")};guard let win=lastWindow,let bounds=frame(win) else{return fail("窗口位置不可读")};let p=CGPoint(x:bounds.minX+x*(bounds.width-1),y:bounds.minY+y*(bounds.height-1));let action=m["action"] as? String ?? ""
  func mouse(_ type:CGEventType,_ button:CGMouseButton = .left,_ clicks:Int64=1){let e=CGEvent(mouseEventSource:nil,mouseType:type,mouseCursorPosition:p,mouseButton:button);e?.setIntegerValueField(.mouseEventClickState,value:clicks);e?.post(tap:.cghidEventTap)}
  switch action {case "move":mouse(held ? .leftMouseDragged:.mouseMoved);case "down":held=true;mouse(.leftMouseDown);case "up":mouse(.leftMouseUp);held=false;case "cancel":release();case "left","double":mouse(.leftMouseDown,.left,action=="double" ? 2:1);mouse(.leftMouseUp,.left,action=="double" ? 2:1);case "right":mouse(.rightMouseDown,.right);mouse(.rightMouseUp,.right);case "scroll":let dy=m["dy"] as? Double ?? 0;guard dy.isFinite else{return fail("无效滚动")};CGEvent(scrollWheelEvent2Source:nil,units:.pixel,wheelCount:1,wheel1:Int32(max(-600,min(600,-dy))),wheel2:0,wheel3:0)?.post(tap:.cghidEventTap);default:return fail("未知指针操作")};return ["ok":true,"outcome":"executed"]
}
func descendants(_ root:AXUIElement)->[AXUIElement] {var queue=[root],out:[AXUIElement]=[];while !queue.isEmpty && out.count<1200 {let n=queue.removeFirst();out.append(n);queue.append(contentsOf:(attr(n,"AXChildren") as? [AXUIElement] ?? []).prefix(100))};return out}
func visibleTexts(_ root:AXUIElement,excluding:AXUIElement)->[String] {descendants(root).filter{n in !descendants(excluding).contains(where:{equal($0,n)}) && str(n,"AXRole")=="AXStaticText"}.map{str($0,"AXValue")}.filter{!$0.isEmpty}}
func workbuddyTasks(_ win:AXUIElement,_ nodes:[AXUIElement])->[[String:String]] {guard let rect=frame(win) else{return []};taskElements.removeAll();var out:[[String:String]]=[];for n in nodes {let title=str(n,"AXTitle");guard str(n,"AXRole")=="AXButton",let r=frame(n),r.minX<rect.minX+rect.width*0.25,r.minY>rect.minY+rect.height*0.3,!title.isEmpty,!title.contains("http"),title.count<160,!title.hasPrefix("查看更多"),!["收起","关闭","立即领取","立即前往","Buddy加油站","成长计划"].contains(title) else{continue};let identity=str(n,"AXIdentifier");let occurrence=out.filter{$0["title"]==title}.count;let taskKey=identity.isEmpty ? title+"#"+String(occurrence):identity;let key=taskKeys[taskKey] ?? UUID().uuidString;taskKeys[taskKey]=key;taskElements[key]=n;out.append(["id":key,"title":title]);if out.count>=20 {break}};return out}
func workbuddyTaskTitle(_ win:AXUIElement,_ nodes:[AXUIElement])->String {guard let rect=frame(win) else{return ""};return nodes.first{n in guard str(n,"AXRole")=="AXStaticText",let r=frame(n) else{return false};return r.minX>rect.minX+rect.width*0.25 && r.minY<rect.minY+100 && !str(n,"AXValue").isEmpty}.map{str($0,"AXValue")} ?? "新建任务"}
func attachmentNames(_ field:AXUIElement)->[String] {Array(Set(descendants(field).filter{str($0,"AXRole")=="AXButton"}.map{str($0,"AXTitle")}.filter{$0.range(of:"\\.(pdf|docx?|pptx?|xlsx?|txt|md|csv|png|jpe?g|webp|json)$",options:[.regularExpression,.caseInsensitive]) != nil})).sorted()}
func workbuddyText(_ field:AXUIElement)->String? {guard var text=attr(field,"AXValue") as? String else{return nil};for name in attachmentNames(field) {text=text.replacingOccurrences(of:"\n"+name,with:"")};let clean=text.replacingOccurrences(of:"\u{FEFF}",with:"").replacingOccurrences(of:"\u{200B}",with:"").trimmingCharacters(in:.newlines);let compact=clean.components(separatedBy:.whitespacesAndNewlines).joined();if submitButton(field)==nil && compact=="今天帮你做些什么？@添加上下文，/调用技能与指令" {return ""};return clean}
func composerLabels(_ field:AXUIElement)->[String] {var root=field;for _ in 0..<3 {if let p=element(root,"AXParent"){root=p}};return descendants(root).flatMap{[str($0,"AXTitle"),str($0,"AXValue"),str($0,"AXDescription")]}}
func withPasteboard(_ write:()->Void){let board=NSPasteboard.general;let saved=(board.pasteboardItems ?? []).map{item -> NSPasteboardItem in let copy=NSPasteboardItem();for type in item.types {if let data=item.data(forType:type){copy.setData(data,forType:type)}};return copy};board.clearContents();write();let count=board.changeCount;key(9,.maskCommand);Thread.sleep(forTimeInterval:0.3);if board.changeCount==count {board.clearContents();board.writeObjects(saved)}}
func pasteText(_ text:String){withPasteboard{NSPasteboard.general.setString(text,forType:.string)}}
func pasteURLs(_ urls:[URL]){withPasteboard{NSPasteboard.general.writeObjects(urls as [NSURL])}}
func handle(_ m:[String:Any])->[String:Any] {
 let op=m["op"] as? String ?? ""
 if op=="state" {if (CGSessionCopyCurrentDictionary() as? [String:Any])?["CGSSessionScreenIsLocked"] as? Bool == true {release()};return ["ok":true,"state":state()]}
 if op=="release" {release();return ["ok":true,"outcome":"executed"]}
 if op=="app-switch" {
  guard AXIsProcessTrusted() else{return fail("请在 Mac 辅助功能权限中开启 node")}
  guard (CGSessionCopyCurrentDictionary() as? [String:Any])?["CGSSessionScreenIsLocked"] as? Bool != true else{release();return fail("请先解锁 Mac")}
  if m["action"] as? String=="cancel" {appSwitcher.cancel()}
  else if m["action"] as? String=="next" {releaseMouse();appSwitcher.next()}
  else{return fail("未登记的切换操作")}
  return ["ok":true,"outcome":"executed"]
 }
 if appSwitcher.isActive {appSwitcher.cancel();return fail("应用切换已取消，请重新操作")}
 if op=="permissions" {return ["ok":true,"permission":AXIsProcessTrusted()]}
 if op=="activate" {guard let app=m["app"] as? String,let bundle=allowed[app] else{return fail("此应用尚未接入")};release();if let running=NSRunningApplication.runningApplications(withBundleIdentifier:bundle).first {let ok=running.activate(options:[.activateAllWindows]);return ["ok":ok,"outcome":ok ? "executed":"unknown"]};guard let url=NSWorkspace.shared.urlForApplication(withBundleIdentifier:bundle) else{return fail("Mac 尚未安装此应用")};let config=NSWorkspace.OpenConfiguration();config.activates=true;NSWorkspace.shared.openApplication(at:url,configuration:config,completionHandler:nil);return ["ok":true,"outcome":"executed"]}
 if op=="workbuddy-task" {
  let s=state();guard s["app"] as? String=="workbuddy",m["window"] as? String==s["window"] as? String,let id=m["task"] as? String else{return fail("任务窗口已变化")}
  let node=id=="new" ? lastWindow.flatMap{win in descendants(win).first{str($0,"AXTitle")=="新建任务" && ["AXRadioButton","AXButton","AXTab"].contains(str($0,"AXRole"))}} : taskElements[id]
  guard let node=node else{return fail("任务入口已变化，请在 Mac 选择")};release();let r=AXUIElementPerformAction(node,"AXPress" as CFString);focusID=UUID().uuidString;return ["ok":r == .success,"outcome":r == .success ? "executed":"unknown"]
 }
 if op=="pointer" {let (app,win,_)=front(includeFocus:false);guard (CGSessionCopyCurrentDictionary() as? [String:Any])?["CGSSessionScreenIsLocked"] as? Bool != true,AXIsProcessTrusted(),let app=app,let win=win,allowed.values.contains(app.bundleIdentifier ?? ""),app.bundleIdentifier==lastApp,equal(win,lastWindow),str(win,"AXTitle").trimmingCharacters(in:CharacterSet(charactersIn:"* "))==lastTitle,m["window"] as? String==windowID else{release();return fail("控制窗口已变化")};return pointer(m)}
 let s=state();guard s["permission"] as? Bool == true else{return fail("请在 Mac 系统设置中允许 Input Agent Bridge 使用辅助功能")}
 guard s["app"] as? String != "unknown",m["window"] as? String == s["window"] as? String else{release();return fail("前台应用或窗口已变化，请重新选择目标")}
 if op != "pointer" {guard m["target"] as? String == s["target"] as? String else{return fail("输入目标已变化，内容已保留")}}
 let caps=s["capabilities"] as? [String] ?? []
 guard caps.contains(op) || op=="shortcut" else{return fail("当前目标不支持此操作")}
 if op=="replace-text" {
  guard let text=m["text"] as? String,text.utf16.count<=60000,let base=m["base"] as? String,base==s["text"] as? String,let el=lastElement else{return fail("电脑内容已变化，请先核对两端文字")}
  if s["app"] as? String=="workbuddy" {
   // WorkBuddy's Electron editor needs real input events, not an AXValue-only DOM change.
   guard text.utf16.count<=2800 else{return fail("当前版本超过 2800 字会折叠为附件，请缩短输入后重试")}
   _ = AXUIElementSetAttributeValue(el,"AXFocused" as CFString,kCFBooleanTrue)
   if !attachmentNames(el).isEmpty {guard str(el,"AXValue").hasPrefix(base) else{return fail("附件与文字混排，请先在 WorkBuddy 核对编辑位置")};var range=CFRange(location:0,length:base.utf16.count);guard let value=AXValueCreate(.cfRange,&range),AXUIElementSetAttributeValue(el,"AXSelectedTextRange" as CFString,value) == .success else{return fail("此版本不能安全保留附件进行同步编辑")}}else{key(0,.maskCommand)};pasteText(text)
  }else{let err=AXUIElementSetAttributeValue(el,"AXValue" as CFString,text as CFString);guard err == .success else{return fail("此输入框不接受同步写入，原文已保留")}}
  if let range=m["selection"] as? [Int],range.count==2,range[0]>=0,range[1]>=0,range[0]+range[1]<=text.utf16.count {var r=CFRange(location:range[0],length:range[1]);if let v=AXValueCreate(.cfRange,&r){_ = AXUIElementSetAttributeValue(el,"AXSelectedTextRange" as CFString,v)}}
  var next=state();for _ in 0..<12 {if next["text"] as? String==text || next["target"] as? String != s["target"] as? String {break};Thread.sleep(forTimeInterval:0.025);next=state()};let verified=next["target"] as? String == s["target"] as? String && next["text"] as? String == text
  return ["ok":verified,"outcome":verified ? "verified":"unknown","error":verified ? "":"写入后未能读回，请查看 Mac；不会自动重试","state":next]
 }
 if op=="workbuddy-attach" {
  guard s["app"] as? String=="workbuddy",let field=lastElement,let paths=m["paths"] as? [String],paths.count<=10,let base=m["base"] as? String,base==s["text"] as? String else{return fail("附件目标或草稿已变化")}
  let urls=paths.map{URL(fileURLWithPath:$0)}
  guard urls.allSatisfy({$0.path.contains("/artifacts/mac-bridge/materials/") && FileManager.default.fileExists(atPath:$0.path)}) else{return fail("附件尚未完成校验")}
  _ = AXUIElementSetAttributeValue(field,"AXFocused" as CFString,kCFBooleanTrue)
  let presentBefore=attachmentNames(field);let requested=urls.map{$0.lastPathComponent}
  guard presentBefore.allSatisfy({requested.contains($0)}) else{return fail("WorkBuddy 还有手机未登记的附件，请先核对")}
  let missing=urls.filter{!presentBefore.contains($0.lastPathComponent)};if !missing.isEmpty {pasteURLs(missing)}
  let names=urls.map{$0.lastPathComponent};let present=attachmentNames(field)
  let verified=names.allSatisfy{present.contains($0)}
  return ["ok":verified,"outcome":verified ? "verified":"unknown","error":verified ? "":"WorkBuddy 未回读全部附件，请在电脑添加或检查附件；不会自动提交","state":state()]
 }
 if op=="workbuddy-submit" {
  guard s["app"] as? String=="workbuddy",let field=lastElement,let win=lastWindow,let base=m["base"] as? String,!base.isEmpty,base==s["text"] as? String,let names=m["names"] as? [String],let button=submitButton(field) else{return fail("任务尚未就绪，请核对 WorkBuddy 输入和发送按钮")}
  let present=attachmentNames(field);guard names.sorted()==present.sorted()else{return fail("WorkBuddy 附件未核对通过，输入已保留")}
  let before=visibleTexts(win,excluding:field).filter{$0==base}.count
  let result=AXUIElementPerformAction(button,"AXPress" as CFString);guard result == .success else{return ["ok":false,"outcome":"unknown","error":"发送结果未知，请查看 WorkBuddy；不会重试"]}
  for _ in 0..<20 {
   Thread.sleep(forTimeInterval:0.08)
   if visibleTexts(win,excluding:field).filter({$0==base}).count>before {return ["ok":true,"outcome":"verified","state":state()]}
  }
  return ["ok":false,"outcome":"unknown","error":"尚未读回新任务消息，请在 WorkBuddy 核对；不会重复发送","state":state()]
 }
 if op=="insert-text" {guard let text=m["text"] as? String,text.utf16.count<=12000 else{return fail("输入内容过长")};for character in text {let units=Array(String(character).utf16);let e=CGEvent(keyboardEventSource:nil,virtualKey:0,keyDown:true);units.withUnsafeBufferPointer{e?.keyboardSetUnicodeString(stringLength:units.count,unicodeString:$0.baseAddress)};e?.post(tap:.cghidEventTap);CGEvent(keyboardEventSource:nil,virtualKey:0,keyDown:false)?.post(tap:.cghidEventTap)};return ["ok":true,"outcome":"executed"]}

 if op=="shortcut" {
  if m["action"] as? String=="submit" {guard s["app"] as? String=="codex",let field=lastElement,let button=submitButton(field),let base=m["base"] as? String,base==s["text"] as? String,!base.isEmpty else{return fail("发送目标或内容已变化，请重新核对")};let result=AXUIElementPerformAction(button,"AXPress" as CFString);return ["ok":result == .success,"outcome":result == .success ? "executed":"unknown","error":result == .success ? "":"发送结果未确认，请查看 Codex；不会重试"]}
  guard let action=m["action"] as? String,caps.contains(action) else{return fail("当前编辑器不支持此快捷操作")}
  let keys:[String:(CGKeyCode,CGEventFlags)]=["escape":(53,[]),"select-all":(0,.maskCommand),"copy":(8,.maskCommand),"cut":(7,.maskCommand),"paste":(9,.maskCommand),"delete":(51,[]),"undo":(6,.maskCommand),"redo":(6,[.maskCommand,.maskShift]),"save":(1,.maskCommand),"bold":(11,.maskCommand),"italic":(34,.maskCommand),"underline":(32,.maskCommand),"align-left":(37,.maskCommand),"align-center":(14,.maskCommand),"align-right":(15,.maskCommand)]
  guard let (code,flags)=keys[action] else{return fail("未登记的快捷操作")};key(code,flags);return ["ok":true,"outcome":"executed"]
 }
 return fail("操作未接入")
}
while let line=readLine() {autoreleasepool {do {guard let data=line.data(using:.utf8),let m=try JSONSerialization.jsonObject(with:data) as? [String:Any] else{return};var r=handle(m);r["id"]=m["id"];let out=try JSONSerialization.data(withJSONObject:r,options:[.sortedKeys]);print(String(data:out,encoding:.utf8)!);fflush(stdout)}catch {print("{\"ok\":false,\"error\":\"无效请求\"}");fflush(stdout)}}}
release()
