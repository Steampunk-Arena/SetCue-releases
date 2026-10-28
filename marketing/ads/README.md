# SetCue video ads

## "Hey you…" (`out/setcue-hey-you-ad.mp4`)

1080×1920, 30 s, for TikTok and Meta (Reels, Stories and feed ads). Text stays clear of TikTok's side buttons and caption area. Music: "Iron & Sweat" from the SetCue demo pack (from 0:50.9, so the chorus hits on "That's cool, we do too"); cuts land on its beat (90 BPM).

| Time | Text | Footage |
| --- | --- | --- |
| 0:00 | Hey you… | Desk lights, blurred and dark |
| 0:02 | Yes, you there. | Same |
| 0:04 | The algorithm tells us that you're a person who likes music and lighting. | Desk, lights washing the wall |
| 0:08 | That's cool, we do too. | Lights switch to magenta |
| 0:10 | Download our Desktop DJ | SetCue playing (screenshot) |
| 0:13 | …then look up DMX 512 lighting… | The two RGB pars on the desk |
| 0:17 | …then do a search for MIDI controllers. | SetCue's MIDI controller setup |
| 0:20 | Wait, these lights sync up to videos? | Living room: TV and party lights |
| 0:23 | Yes, they absolutely do. | Red and pink lights on the beat |
| 0:26 | Buy now and get 15% off with code 15OFF · getsetcue.com | End card |

### Captions

**TikTok**

> the algorithm knows 👀 desktop DJ + DMX lights + MIDI controllers, all in one app. 15% off with code 15OFF 🎧💡 #djsetup #dmxlighting #roomsetup #desksetup #mididj

**Meta (primary text)**

> Hey you. Yes, you. 👀
> SetCue turns the music on your computer into a DJ set, with visuals and real DMX lights that move to the beat. Plug in a MIDI controller and mix like a pro.
> Try every feature free for 14 days. Buying? Use code **15OFF** for 15% off.

**Meta headline:** Your music. Your lights. One app.
**Call to action:** Download · Link: https://getsetcue.com

### Before you run it

- The 15OFF code must be the actual Gumroad code (not just the discount's name).
- DJ lights, MIDI and music videos are in the Windows version; Mac and Linux are coming soon. Target Windows users, or keep "Windows" in the copy, so Mac buyers aren't disappointed.

## Rebuilding

Put the two light-demo videos in `source/` as `light-demo-1.mp4` (vertical desk clip) and `light-demo-2.mp4` (wide living-room clip), then:

```sh
node marketing/ads/build-ad.js "<path to Iron & Sweat.mp3>"
```

The source videos are kept out of git because this repository is public. The SetCue screens come from `../facebook/source/`.
