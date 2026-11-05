import Foundation
import CoreBluetooth

let serviceID=CBUUID(string:"F468B188-20D3-4B47-A4BD-8E573840A070")
let receiveID=CBUUID(string:"F468B188-20D3-4B47-A4BD-8E573840A071")
let transmitID=CBUUID(string:"F468B188-20D3-4B47-A4BD-8E573840A072")
func emit(_ value:[String:Any]) {
    if let data=try? JSONSerialization.data(withJSONObject:value) { FileHandle.standardOutput.write(data); FileHandle.standardOutput.write(Data([10])) }
}
final class BluetoothServer:NSObject,CBPeripheralManagerDelegate {
    var manager:CBPeripheralManager!
    var central:CBCentral?
    var tx:CBMutableCharacteristic?
    var peer=""
    var incoming=Data()
    var outgoing=Data()
    func start() { manager=CBPeripheralManager(delegate:self,queue:.main) }
    func peripheralManagerDidUpdateState(_ peripheral:CBPeripheralManager) {
        guard peripheral.state == .poweredOn else { close();emit(["kind":"status","status":"unavailable","reason":"bluetooth-state-\(peripheral.state.rawValue)"]);return }
        let service=CBMutableService(type:serviceID,primary:true)
        let rx=CBMutableCharacteristic(type:receiveID,properties:[.write,.writeWithoutResponse],value:nil,permissions:[.writeEncryptionRequired])
        let notify=CBMutableCharacteristic(type:transmitID,properties:[.notify,.notifyEncryptionRequired],value:nil,permissions:[])
        tx=notify;service.characteristics=[rx,notify];peripheral.removeAllServices();peripheral.add(service)
    }
    func peripheralManager(_ peripheral:CBPeripheralManager,didAdd service:CBService,error:Error?) {
        guard error == nil else { emit(["kind":"status","status":"unavailable","reason":"gatt-service-failed"]);return }
        peripheral.startAdvertising([CBAdvertisementDataServiceUUIDsKey:[serviceID],CBAdvertisementDataLocalNameKey:"Input Agent Mac"])
    }
    func peripheralManagerDidStartAdvertising(_ peripheral:CBPeripheralManager,error:Error?) { emit(["kind":"status","status":error == nil ? "listening":"unavailable","reason":error == nil ? "encrypted-gatt":"gatt-advertising-failed"]) }
    func peripheralManager(_ peripheral:CBPeripheralManager,central next:CBCentral,didSubscribeTo characteristic:CBCharacteristic) {
        guard characteristic.uuid == transmitID else { return }
        guard central == nil || central?.identifier == next.identifier else { return }
        central=next;emit(["kind":"status","status":"encrypted-notification-subscribed"]);pump()
    }
    func peripheralManager(_ peripheral:CBPeripheralManager,central next:CBCentral,didUnsubscribeFrom characteristic:CBCharacteristic) { if central?.identifier == next.identifier { close();central=nil } }
    func peripheralManager(_ peripheral:CBPeripheralManager,didReceiveWrite requests:[CBATTRequest]) {
        guard let first=requests.first else { return }
        for request in requests {
            guard request.characteristic.uuid == receiveID,request.offset == 0,let bytes=request.value,
                  let current=central,current.identifier == request.central.identifier else { peripheral.respond(to:first,withResult:.writeNotPermitted);return }
            receive(bytes)
        }
        peripheral.respond(to:first,withResult:.success)
    }
    func receive(_ data:Data) {
        incoming.append(data)
        while let end=incoming.firstIndex(of:10) {
            let line=Data(incoming.prefix(upTo:end));incoming.removeSubrange(...end)
            guard line.count<=262144,let text=String(data:line,encoding:.utf8),let value=try? JSONSerialization.jsonObject(with:line) else { close();return }
            if let row=value as? [String:Any],row["kind"] as? String == "pair" { close(resetInput:false);peer=UUID().uuidString;emit(["kind":"open","peer":peer]) }
            if !peer.isEmpty { emit(["kind":"data","peer":peer,"data":text]) }
        }
        if incoming.count>262144 { close() }
    }
    func reportBuffered() { if !peer.isEmpty { emit(["kind":"buffered","peer":peer,"bytes":outgoing.count]) } }
    func pump() {
        defer { reportBuffered() }
        guard let central,let tx else { return }
        while !outgoing.isEmpty {
            let count=min(outgoing.count,central.maximumUpdateValueLength)
            guard count>0,manager.updateValue(Data(outgoing.prefix(count)),for:tx,onSubscribedCentrals:[central]) else { return }
            outgoing.removeFirst(count)
        }
    }
    func peripheralManagerIsReady(toUpdateSubscribers peripheral:CBPeripheralManager) { pump() }
    func command(_ data:Data) {
        guard let row=try? JSONSerialization.jsonObject(with:data) as? [String:Any],!peer.isEmpty,row["peer"] as? String == peer else { return }
        if row["kind"] as? String == "close" { close() }
        else if row["kind"] as? String == "data",let text=row["data"] as? String {
            guard !text.contains("\n"),text.utf8.count<=262144,outgoing.count+text.utf8.count+1<=1048576 else { close();return }
            outgoing.append(contentsOf:text.utf8);outgoing.append(10);pump()
        }
    }
    func close(resetInput:Bool=true) { outgoing.removeAll();if resetInput { incoming.removeAll() };if !peer.isEmpty { let old=peer;peer="";emit(["kind":"close","peer":old]) } }
    func stop() { close();manager?.stopAdvertising();manager?.removeAllServices() }
}
let server=BluetoothServer();server.start()
DispatchQueue.global().async {
    while let line=readLine() { let data=Data(line.utf8);DispatchQueue.main.async { server.command(data) } }
    DispatchQueue.main.async { server.stop();exit(0) }
}
RunLoop.main.run()
