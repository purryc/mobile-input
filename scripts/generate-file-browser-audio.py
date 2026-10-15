"""Recreate the original, non-speech sales-meeting cue bundled in the demo."""
from pathlib import Path
import math
import struct
import wave

root = Path(__file__).resolve().parents[1]
output = root / 'apps/web/public/assets/workbuddy/meeting-cue.wav'
rate, duration = 22050, 1.2
samples = bytearray()
for index in range(round(rate * duration)):
    time = index / rate
    local = time % .6
    envelope = min(1, local / .035, (.6 - local) / .08)
    frequency = 660 if time < .6 else 880
    samples.extend(struct.pack('<h', round(8500 * envelope * math.sin(2 * math.pi * frequency * local))))
with wave.open(str(output), 'wb') as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(rate)
    audio.writeframes(samples)
print(output.relative_to(root))
