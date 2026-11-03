import Foundation

// Timed independently of accessibility scans and stdin reads; never leave Command held.
final class NativeAppSwitcher {
 private let lock = NSLock()
 private var active = false
 private var generation = 0
 private let command: (Bool) -> Void
 private let tab: () -> Void
 private let escape: () -> Void
 private let schedule: (Double, @escaping () -> Void) -> Void
 init(command: @escaping (Bool) -> Void, tab: @escaping () -> Void, escape: @escaping () -> Void,
      schedule: @escaping (Double, @escaping () -> Void) -> Void = { delay, work in DispatchQueue.global(qos: .userInteractive).asyncAfter(deadline: .now()+delay, execute: work) }) {
  self.command=command; self.tab=tab; self.escape=escape; self.schedule=schedule
 }
 var isActive: Bool { lock.lock(); defer {lock.unlock()}; return active }
 func next() {
  lock.lock()
  generation += 1; let ticket=generation
  if !active {active=true; command(true)}
  tab(); lock.unlock()
  schedule(1.2) { [weak self] in self?.finish(ticket: ticket) }
 }
 private func finish(ticket: Int) {
  lock.lock(); defer {lock.unlock()}
  guard active, generation==ticket else{return}
  command(false); active=false
 }
 func cancel() {
  lock.lock(); defer {lock.unlock()}
  generation += 1
  if active {escape(); command(false); active=false}
 }
}
