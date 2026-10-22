# Outreach kit

Templates for the people side of the project: talking to the people who live with these barriers, and getting the findings to the people who can fix them. Adapt the wording to your own voice. Translate into Gujarati or Hindi with help from someone fluent, so participants fully understand what they are agreeing to.

---

## 1. Walk-along or interview with a wheelchair user, older person or parent with a pram

**Who:** 2–3 people who regularly get around the study area. Ask through family, neighbours, a local disability organisation, or a hospital or physiotherapy clinic. If a participant is under 18, ask a parent or guardian too.

**How:** a 20–30 minute walk along one surveyed street, or a sit-down chat while going through the photos together. Bring a printed copy of the street report.

### Consent (read aloud or hand over, before starting)
> I'm Om Dorkar, a student. I'm mapping barriers on footpaths and crossings in Alkapuri, Sayaji Baug and around the railway station, so they can be reported to the city and fixed. The map is public: omdorkar.github.io/vadodara-access-map
>
> I'd like to ask you a few questions about getting around these streets.
> - Taking part is your choice. You can skip any question or stop at any time.
> - I will **not** photograph you or record your voice unless you say yes below.
> - I'll only quote you in the way you choose below, and I'll show you any quote before it is published.
> - You can ask me to remove your words later: [phone or email]
>
> **Please choose:**
> ☐ You may quote me by first name  ☐ Quote me without any name  ☐ Don't quote me, use my answers only for the ratings
> ☐ You may take a photo of me (optional)  ☐ No photos of me
>
> Name: ____________ Signature or verbal OK: ____________ Date: ________

### Questions
1. How do you usually get around this area: wheelchair, walker, cane, on foot with a pram, other?
2. Which places here are hardest to reach or cross? What happens when you meet a barrier there?
3. *(Show 5–6 survey photos.)* For each one: could you get past it? Rate it **High** (can't pass), **Medium** (possible but hard or unsafe), or **Low** (annoying).
4. What's missing from my list? Is there anything I didn't photograph that affects you most?
5. If the city could fix just one thing on this street, what should it be?
6. Is there anything you'd like the city, or people reading this, to know?

**Afterwards:**
- Update the severity in `data/survey.js` where participants rated a barrier differently. Note it in the barrier's `desc`, e.g. "Rated High by 2 of 3 wheelchair users".
- Keep the signed or recorded consents privately, **not** in the public repo.

---

## 2. Email to a local disability organisation

> **Subject:** Footpath accessibility map for Alkapuri / Sayaji Baug: would your members review it?
>
> Dear [name / team],
>
> I'm Om Dorkar, a student in Vadodara. I've surveyed footpaths and crossings in Alkapuri, Sayaji Baug and around the railway station, and documented [N] barriers with photos and exact locations, for example missing kerb ramps, blocked footpaths and open drains. The map and a printable street report are here: https://omdorkar.github.io/vadodara-access-map/
>
> Could I meet one or two of your members for 30 minutes? I'd like them to tell me which barriers matter most and what I've missed. I'd also be glad to share the report with your organisation, or send it to the Vadodara Municipal Corporation jointly if you think that would help.
>
> The project is non-commercial and open: the data is free for anyone to use.
>
> Thank you,
> Om Dorkar · [phone] · [email]

---

## 3. Letter to the Vadodara Municipal Corporation

**How to send:** check the VMC's official website for its current complaint or grievance channel and the office address for your ward. Submit through whichever official channel it lists. **Keep the acknowledgement or reference number and the date**; that is the evidence. Attach the street report as a PDF: open `report.html` and choose *Print / save as PDF*.

> To: The Municipal Commissioner, Vadodara Municipal Corporation
> (Copy: Ward office, [ward name / number])
>
> **Subject:** Accessibility barriers on footpaths and crossings in Alkapuri, Sayaji Baug and the railway station area: survey report with locations and photos
>
> Respected Sir / Madam,
>
> I am Om Dorkar, a student in Vadodara. Between [dates] I surveyed footpaths and crossings in Alkapuri, Sayaji Baug and the railway station area on foot. I documented **[N] barriers** that make these streets difficult or impossible to use for wheelchair users, older people and parents with prams. **[H]** of them completely block wheelchair access.
>
> The attached report lists each barrier with a photo, exact location, severity, and a suggested fix. The most urgent are:
> 1. [B-01: type, street, one line]
> 2. [B-02: …]
> 3. [B-03: …]
>
> The Rights of Persons with Disabilities Act, 2016 calls for accessible public spaces, and the *Harmonised Guidelines and Standards for Universal Accessibility in India (2021)* give the standards for kerb ramps, tactile paving and clear footpaths.
>
> I request that these locations be inspected and included in upcoming footpath repair work. The full map is public at https://omdorkar.github.io/vadodara-access-map/. I would be happy to walk the route with an officer.
>
> Thank you for your time.
>
> Yours faithfully,
> Om Dorkar
> [address] · [phone] · [email] · [date]

**After sending:** if anything gets fixed, photograph it, update the barrier on the map, and note the date. A "before → after" pair is the strongest evidence of impact.
