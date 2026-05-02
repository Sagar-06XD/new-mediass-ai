const fs = require('fs');
const path = require('path');
const { processRawText } = require('../services/ragService');

const USER_ID = 'c99f2e9a-cb77-4c34-8e51-21b4eb14989d';

const chunks = [
  {
    problem: "Heart Attack",
    symptoms: "Chest pain (pressure, tightness, squeezing), pain radiating to left arm/neck/jaw, shortness of breath, nausea, sweating.",
    solution: "Medical Emergency - Call 999. Sit and rest while waiting for an ambulance. Chew a 300mg aspirin if available and not allergic."
  },
  {
    problem: "Coronary Heart Disease",
    symptoms: "Angina (chest pain), shortness of breath, heart palpitations, feeling faint.",
    solution: "Lifestyle changes (balanced diet, regular exercise, stopping smoking). Medications like statins or blood thinners as prescribed by a GP."
  },
  {
    problem: "Heart Failure",
    symptoms: "Breathlessness (even at rest), persistent cough, extreme tiredness, swollen ankles/legs.",
    solution: "Manage salt and fluid intake. Exercise within your limits. Use prescribed ACE inhibitors or beta-blockers."
  },
  {
    problem: "High Blood Pressure",
    symptoms: "Often no symptoms (\"Silent Killer\"). Severe cases may cause headaches or nosebleeds.",
    solution: "Reduce salt intake, lose weight, limit alcohol, and increase physical activity."
  },
  {
    problem: "Common Cold",
    symptoms: "Blocked/runny nose, sore throat, headaches, muscle aches, sneezing.",
    solution: "Rest and sleep. Drink plenty of water. Gargle salt water for a sore throat. Use over-the-counter decongestants."
  },
  {
    problem: "Influenza (Flu)",
    symptoms: "Sudden high fever, exhaustion, dry chesty cough, chills.",
    solution: "Stay warm and rest. Paracetamol or ibuprofen to lower temperature. Stay hydrated."
  },
  {
    problem: "Chest Infection",
    symptoms: "Persistent cough, bringing up yellow/green phlegm, wheezing, rapid heartbeat.",
    solution: "Use extra pillows at night to keep the head elevated. Use a humidifier or inhale steam. Drink plenty of fluids to thin mucus."
  },
  {
    problem: "Indigestion / GORD",
    symptoms: "Heartburn (burning sensation in chest), acid reflux, bloating, feeling sick.",
    solution: "Eat smaller, more frequent meals. Avoid trigger foods (fatty/spicy). Don't eat 3-4 hours before bed."
  },
  {
    problem: "Gastroenteritis",
    symptoms: "Sudden watery diarrhoea, vomiting, stomach cramps, low fever.",
    solution: "Sip oral rehydration salt (ORS) solutions. Eat plain foods (rice, toast) when ready. Stay home for 48 hours after symptoms stop."
  },
  {
    problem: "Constipation",
    symptoms: "Hard/lumpy stools, straining, feeling unable to fully empty bowels.",
    solution: "Increase dietary fiber (fruit, veg, oats). Drink more water. Increase daily activity/walking."
  },
  {
    problem: "Raynaud's Phenomenon",
    symptoms: "Fingers/toes turning white then blue in the cold, numbness, pins and needles.",
    solution: "Keep whole body warm. Wear thick gloves/socks. Stop smoking to improve circulation."
  },
  {
    problem: "Headaches",
    symptoms: "Pain in head/neck, sensitivity to light (migraine), tension.",
    solution: "Maintain a regular sleep schedule. Stay hydrated. Apply a cool compress to the forehead."
  },
  {
    problem: "Diabetes Type 2",
    symptoms: "Feeling very thirsty, peeing more than usual (especially at night), blurred vision.",
    solution: "Low-glycemic diet. Regular exercise. Regular foot checks to prevent sores."
  },
  {
    problem: "Anxiety and Stress",
    symptoms: "Racing heart, sweating, worrying constantly, difficulty sleeping.",
    solution: "Practice deep breathing exercises. Limit caffeine and alcohol. Use \"Mindfulness\" techniques."
  },
  {
    problem: "Urinary Tract Infection (UTI)",
    symptoms: "Pain/stinging when peeing, needing to pee suddenly, dark or cloudy pee.",
    solution: "Drink plenty of water to flush out bacteria. Avoid sugary drinks. Use a hot water bottle for abdominal pain."
  },
  {
    problem: "Stroke",
    symptoms: "Face drooping on one side, inability to lift both arms, slurred speech (FAST test).",
    solution: "Emergency. Call 999 immediately. Time is critical to save brain function."
  },
  {
    problem: "Angina",
    symptoms: "Dull, heavy, or tight chest pain that stops within a few minutes of resting.",
    solution: "Stop what you are doing and rest. Use your prescribed GTN (glyceryl trinitrate) spray. Avoid heavy meals and smoking."
  },
  {
    problem: "Iron Deficiency Anaemia",
    symptoms: "Tiredness, lack of energy, shortness of breath, pale skin, heart palpitations.",
    solution: "Eat iron-rich foods (dark green leafy vegetables, meat, beans). Take GP-prescribed iron supplements with orange juice (Vitamin C aids absorption)."
  },
  {
    problem: "Asthma",
    symptoms: "Wheezing, breathlessness, tight chest, coughing (especially at night).",
    solution: "Identify and avoid triggers (dust, pollen, pet dander). Always carry your prescribed reliever inhaler (usually blue)."
  },
  {
    problem: "COPD",
    symptoms: "Increasing breathlessness, persistent chesty cough, frequent chest infections.",
    solution: "Stop smoking (most critical step). Keep active with gentle exercise. Use prescribed inhalers and practice breathing techniques."
  },
  {
    problem: "Pneumonia",
    symptoms: "Cough (may cough up yellow/green mucus), difficulty breathing, high heartbeat, fever.",
    solution: "Needs medical assessment (often antibiotics). At home: get plenty of rest, drink fluids to prevent dehydration, and take paracetamol to lower fever."
  },
  {
    problem: "Irritable Bowel Syndrome (IBS)",
    symptoms: "Stomach cramps, bloating, diarrhoea, and/or constipation.",
    solution: "Keep a food diary to identify triggers. Cook homemade meals using fresh ingredients. Avoid caffeine, fizzy drinks, and processed foods."
  },
  {
    problem: "Haemorrhoids (Piles)",
    symptoms: "Bright red blood after pooping, an itchy anus, feeling a lump down below.",
    solution: "Drink lots of water and eat high-fiber foods to soften stool. Take warm baths to ease itching. Use over-the-counter soothing creams."
  },
  {
    problem: "Stomach Ulcer",
    symptoms: "Burning or gnawing pain in the center of the tummy, indigestion, heartburn, feeling sick.",
    solution: "Avoid spicy foods, coffee, and alcohol, which irritate the stomach lining. Manage stress levels. Requires a doctor's diagnosis for acid-reducing medication."
  },
  {
    problem: "Gallstones",
    symptoms: "Sudden, severe abdominal pain (usually top right), nausea, vomiting, sweating.",
    solution: "Eat a healthy, balanced diet low in saturated fats to prevent flare-ups. Use a heat pad on your stomach and over-the-counter painkillers during mild attacks."
  },
  {
    problem: "Acne",
    symptoms: "Spots, blackheads, oily skin, hot or painful to touch, mostly on face/back/chest.",
    solution: "Wash affected area twice daily with a mild soap. Do not squeeze spots (causes scarring). Use over-the-counter creams containing benzoyl peroxide."
  },
  {
    problem: "Cold Sores",
    symptoms: "A tingling or itching sensation around the mouth, followed by small fluid-filled blisters.",
    solution: "Apply over-the-counter antiviral creams (like acyclovir) as soon as you feel the tingling. Use cold compresses to reduce redness and avoid sharing lip balms."
  },
  {
    problem: "Eczema",
    symptoms: "Itchy, dry, cracked, and sore patches of skin.",
    solution: "Apply medical emollients (moisturizers) daily. Avoid scratching, which worsens inflammation. Use mild, fragrance-free soaps and wear soft cotton clothing."
  },
  {
    problem: "Chickenpox",
    symptoms: "Itchy, spotty rash that turns into fluid-filled blisters, fever, aches.",
    solution: "Drink plenty of fluid. Use cooling creams or calamine lotion to soothe itching. Bathe in cool water and gently pat the skin dry."
  },
  {
    problem: "Gout",
    symptoms: "Sudden, severe pain in a joint (often the big toe), hot, swollen, red skin over the joint.",
    solution: "Rest and raise the affected limb. Keep the joint cool with an ice pack wrapped in a towel. Avoid alcohol and foods high in purines (like red meat)."
  },
  {
    problem: "Migraine",
    symptoms: "Severe throbbing pain on one side of the head, nausea, sensitivity to light and sound.",
    solution: "Rest in a quiet, dark room. Apply a cold pack to the forehead. Drink water and take over-the-counter pain relief early in the attack."
  },
  {
    problem: "Osteoarthritis",
    symptoms: "Joint pain and stiffness (especially in knees, hips, and hands), swelling, grating or crackling sound when moving.",
    solution: "Maintain a healthy weight to reduce joint strain. Engage in low-impact exercises like swimming. Use hot or cold packs on aching joints."
  },
  {
    problem: "Plantar Fasciitis",
    symptoms: "Sharp pain on the bottom of the foot, near the heel, especially during the first steps in the morning.",
    solution: "Rest your foot and avoid walking barefoot. Roll a frozen water bottle under your foot to reduce inflammation. Wear shoes with good arch support."
  },
  {
    problem: "Sciatica",
    symptoms: "Pain radiating from the lower back down through the buttock and back of the leg, numbness, or tingling.",
    solution: "Stay as active as possible; prolonged bed rest can make it worse. Apply heat packs to the lower back. Perform gentle back stretches."
  },
  {
    problem: "Tonsillitis",
    symptoms: "Sore throat, red and swollen tonsils, difficulty swallowing, high temperature, coughing.",
    solution: "Rest and drink plenty of cool fluids. Gargle with warm salty water (adults only) to relieve throat pain. Take paracetamol or ibuprofen to ease fever and pain."
  },
  {
    problem: "Sinusitis",
    symptoms: "Pain, swelling, and tenderness around your cheeks, eyes, or forehead, blocked nose, reduced sense of smell.",
    solution: "Use a warm compress over your face to ease pressure. Inhale steam from a bowl of hot water. Clean your nose with a saltwater rinse."
  },
  {
    problem: "Conjunctivitis",
    symptoms: "Red, bloodshot eye(s), itchiness, a gritty feeling, sticky yellow or green discharge.",
    solution: "Boil water and let it cool, then use a clean cotton pad to gently wipe your eyelashes to remove crusts. Wash hands regularly and do not share towels to prevent spreading."
  },
  {
    problem: "Athlete's Foot",
    symptoms: "Itchy white patches between your toes, red/sore and flaky skin on your feet, cracked or bleeding skin.",
    solution: "Dry your feet thoroughly after washing, especially between the toes. Wear clean cotton socks every day. Use over-the-counter antifungal creams or sprays."
  },
  {
    problem: "Ringworm",
    symptoms: "A ring-shaped red or silvery rash on the skin, which can be dry, scaly, and very itchy.",
    solution: "Keep the affected area clean and dry. Apply over-the-counter antifungal creams daily. Wash bedsheets and clothes separately on a hot wash."
  },
  {
    problem: "Hay Fever",
    symptoms: "Sneezing, coughing, a runny or blocked nose, itchy/red/watery eyes, itchy throat.",
    solution: "Put Vaseline around your nostrils to trap pollen. Wear wraparound sunglasses to stop pollen from getting in your eyes. Take over-the-counter antihistamines."
  },
  {
    problem: "Hives",
    symptoms: "A raised, itchy rash (weals) that appears on the skin, which can be red or skin-colored and sting.",
    solution: "Avoid triggers if known (certain foods, heat, stress). Take antihistamines to reduce itching. Apply a cool compress to the rash to soothe the skin."
  },
  {
    problem: "Shingles",
    symptoms: "A tingling or painful feeling in an area of skin, followed by a rash that turns into itchy blisters, usually on one side of the body.",
    solution: "Wear loose-fitting clothes. Apply a cool compress to the blisters. Avoid pregnant women and those who haven't had chickenpox. Needs a GP visit for antiviral medicine within 72 hours of the rash appearing."
  },
  {
    problem: "Vertigo",
    symptoms: "A feeling that you or the environment around you is spinning, loss of balance, feeling sick or dizzy.",
    solution: "Sit or lie down immediately when it happens. Turn your head slowly and carefully. Sleep with your head slightly raised on two or more pillows."
  },
  {
    problem: "Tinnitus",
    symptoms: "Hearing ringing, buzzing, hissing, or throbbing sounds in one or both ears that do not come from the outside.",
    solution: "Try to relax using deep breathing or yoga, as stress can make it worse. Listen to soft, constant noise (like a fan or white noise track) to mask the sound, especially at night."
  },
  {
    problem: "Appendicitis",
    symptoms: "Sudden, severe pain that usually begins around the belly button and moves to the lower right side of the abdomen, worsening when coughing or walking.",
    solution: "Emergency. Go to the A&E or call for an ambulance immediately. Do not take pain relief or eat/drink anything until seen by a doctor, as surgery is usually required."
  },
  {
    problem: "Kidney Stones",
    symptoms: "Intense, gripping pain in the back, side, or groin, feeling sick, blood in urine.",
    solution: "Drink plenty of water (up to 3 liters a day) to help flush the stone out. Take painkillers. If the pain is unbearable or accompanied by a high fever, seek immediate medical attention."
  },
  {
    problem: "Carpal Tunnel Syndrome",
    symptoms: "An ache or pain in your fingers, hand, or arm, numbness or tingling (pins and needles) in the hands, a weak grip.",
    solution: "Wear a wrist splint, especially at night, to keep your wrist straight. Avoid repetitive tasks that bend your wrist. Gently stretch your hands and fingers."
  },
  {
    problem: "Frozen Shoulder",
    symptoms: "Persistent pain and stiffness in the shoulder joint, making it difficult to dress, sleep, or lift your arm.",
    solution: "Keep the shoulder moving gently; resting it completely can make stiffness worse. Use hot or cold packs to reduce pain. Take painkillers like ibuprofen."
  },
  {
    problem: "Restless Legs Syndrome",
    symptoms: "An overwhelming urge to move your legs, usually accompanied by a crawling or tingling sensation, often worse in the evening or at night.",
    solution: "Massage your legs and take a warm bath before bed. Cut down on caffeine, alcohol, and smoking. Practice good sleep hygiene."
  },
  {
    problem: "Sleep Apnoea",
    symptoms: "Breathing stops and starts while sleeping, loud snoring, gasping or choking noises during sleep, feeling very tired during the day.",
    solution: "Lose weight if overweight. Sleep on your side rather than your back. Avoid alcohol and smoking before bed. GP diagnosis is required to get a CPAP machine if necessary."
  },
  {
    problem: "Dandruff",
    symptoms: "White or grey flakes of skin in your hair and on your shoulders, an itchy and dry scalp.",
    solution: "Use over-the-counter anti-dandruff shampoos containing zinc pyrithione or salicylic acid. Wash your hair regularly and avoid scratching your scalp, which can cause infection."
  },
  {
    problem: "Warts and Verrucas",
    symptoms: "Small, rough lumps on the skin (warts on hands/knees, verrucas on the soles of feet with tiny black dots).",
    solution: "Apply over-the-counter salicylic acid treatments daily. File the wart gently with an emery board once a week. Do not share towels, shoes, or socks."
  },
  {
    problem: "Oral Thrush",
    symptoms: "White patches in the mouth or on the tongue, loss of taste, redness or soreness inside the mouth.",
    solution: "Maintain excellent oral hygiene (brush twice a day). Rinse your mouth out after using corticosteroid inhalers. Requires a pharmacist or GP for antifungal gels/drops."
  },
  {
    problem: "Endometriosis",
    symptoms: "Severe pelvic pain (especially during periods), heavy periods, pain during sex, difficulty getting pregnant.",
    solution: "Manage pain with ibuprofen or paracetamol. Use a hot water bottle on your tummy. Speak to a GP for hormonal treatments or further medical intervention."
  },
  {
    problem: "Psoriasis",
    symptoms: "Red, flaky, crusty patches of skin covered with silvery scales, which can be itchy or sore. Often appears on elbows, knees, and the scalp.",
    solution: "Keep the skin heavily moisturized. Use GP-prescribed topical treatments (like vitamin D analogues or corticosteroid creams). Get regular, controlled, and brief exposure to natural sunlight."
  },
  {
    problem: "Rosacea",
    symptoms: "Redness across the nose and cheeks, visible broken blood vessels, small red bumps or pus-filled spots, and a stinging or burning sensation on the skin.",
    solution: "Avoid known triggers like spicy foods, alcohol, caffeine, and extreme temperatures. Use a high SPF broad-spectrum sunscreen daily. Apply prescription creams or gels to reduce redness."
  },
  {
    problem: "Impetigo",
    symptoms: "Red sores or blisters that burst and leave crusty, golden-brown patches, usually on the face or hands. Highly contagious.",
    solution: "Wash the affected areas gently with warm water and soap. Do not share towels or facecloths. Requires a GP visit for antibiotic cream or tablets to clear the infection."
  },
  {
    problem: "Cellulitis",
    symptoms: "An area of skin that suddenly becomes red, hot, swollen, and very painful to touch. Often accompanied by a fever, shivering, or feeling unwell.",
    solution: "Requires urgent medical attention. You will need prescription antibiotics because the infection is deep in the skin. Elevate the affected body part to help reduce swelling."
  },
  {
    problem: "Scabies",
    symptoms: "Intense itching (especially at night), a raised rash or tiny spots, and visible track marks where mites have burrowed under the skin.",
    solution: "Treat the whole body with a special cream or lotion from the pharmacist (like permethrin). Wash all bedding, towels, and clothing at a high temperature. Everyone in the household must be treated simultaneously."
  },
  {
    problem: "Vitiligo",
    symptoms: "Pale white patches appearing on the skin, often starting on the face, neck, and hands, due to a lack of melanin (pigment).",
    solution: "Protect the white patches from the sun with a high SPF sunscreen, as they burn very easily. Use skin camouflage creams to blend the color. Medical treatments may include topical steroids or phototherapy."
  },
  {
    problem: "Contact Dermatitis",
    symptoms: "Red, itchy, blistered, or dry and cracked skin caused directly by touching a specific irritant or allergen (like harsh soaps, nickel, or certain plants).",
    solution: "Identify and immediately stop contact with the substance causing the reaction. Wash the skin with warm water to remove residue. Use thick emollients (moisturizers) and topical corticosteroids to reduce inflammation."
  },
  {
    problem: "Melanoma",
    symptoms: "A new mole appearing, or a change in an existing mole (it gets larger, changes shape, has irregular colors, bleeds, crusts, or becomes itchy).",
    solution: "Requires urgent medical evaluation by a GP or dermatologist for biopsy and removal. Prevent by avoiding severe sunburn, staying in the shade during peak sun hours, and regularly using high SPF sunscreen."
  },
  {
    problem: "Boils",
    symptoms: "A hard, red, painful lump under the skin that fills with pus, grows larger, and eventually forms a white or yellow head.",
    solution: "Apply a warm, damp facecloth to the boil for 10 minutes, 3 or 4 times a day to encourage it to burst and drain naturally. Do not squeeze or pierce it yourself, as this spreads the infection."
  },
  {
    problem: "Heat Rash",
    symptoms: "Small, raised red spots, an itchy, prickly feeling, and mild swelling on the skin, usually occurring when sweating more than usual.",
    solution: "Move to a cool environment. Wear loose, breathable cotton clothing. Apply cold, damp cloths to the skin. Calamine lotion can help soothe the itching and irritation."
  },
  {
    problem: "Seborrhoeic Dermatitis",
    symptoms: "Red, flaky, itchy patches of skin, often on the scalp (severe dandruff), face, or chest. In babies, it causes crusty, greasy yellow patches on the head.",
    solution: "For adults, use medicated antifungal shampoos or creams. For babies with cradle cap, gently massage the scalp with baby oil and softly brush away the loose crusts; do not pick at them."
  },
  {
    problem: "Molluscum Contagiosum",
    symptoms: "Small, firm, raised spots on the skin that usually have a tiny dimple in the middle. They are generally painless but can become itchy.",
    solution: "It is harmless and often clears up on its own without treatment, though it can take several months. Do not squeeze the spots or share towels, as the virus is highly contagious."
  },
  {
    problem: "Lichen Planus",
    symptoms: "Clusters of itchy, shiny, red or purple bumps on the skin, or white lacy patches inside the mouth.",
    solution: "Use steroid creams or ointments prescribed by a doctor to reduce inflammation and clear the rash. Over-the-counter antihistamines can help manage the intense itching."
  },
  {
    problem: "Folliculitis",
    symptoms: "Small red bumps or white-headed pimples appearing directly around hair follicles, accompanied by skin redness, tenderness, and itching.",
    solution: "Use warm compresses to soothe the area and help it drain. Wash daily with an antibacterial soap. Avoid shaving or waxing the affected area until the infection fully clears."
  },
  {
    problem: "Sunburn",
    symptoms: "Hot, red, and painful skin that feels tight. The skin may blister and will usually peel after a few days.",
    solution: "Get out of the sun immediately. Cool the skin with a cold sponge or a cool shower. Drink plenty of water to prevent dehydration. Apply aloe vera gel or a dedicated aftersun cream."
  },
  {
    problem: "Chilblains",
    symptoms: "Small, itchy, red patches on the skin (most often on toes and fingers) that appear after being in the cold. The skin may feel like it is burning.",
    solution: "Keep hands and feet warm with gloves and thick socks when outside. Do not warm up cold skin too quickly (avoid putting cold feet directly on a hot radiator). Do not scratch the itchy patches."
  },
  {
    problem: "Keratosis Pilaris",
    symptoms: "Small, painless bumps on the skin, usually on the back of the upper arms, thighs, or buttocks. The skin feels rough, like sandpaper.",
    solution: "It is harmless and cannot be completely cured, but you can improve the texture by using soap-free cleansers and heavily applying moisturizers that contain urea, lactic acid, or salicylic acid."
  },
  {
    problem: "Jock Itch",
    symptoms: "A very itchy, red, inflamed, and sometimes ring-shaped rash in the groin area and inner thighs.",
    solution: "Wash the groin area daily and dry it thoroughly. Change your underwear every day. Apply an over-the-counter antifungal cream, continuing use for a few days even after the rash disappears."
  },
  {
    problem: "Melasma",
    symptoms: "Brown or grey-brown patches appearing on the face, usually on the cheeks, bridge of the nose, forehead, or upper lip. Often triggered by sun exposure or hormonal changes (like pregnancy).",
    solution: "Wear a broad-spectrum sunscreen (SPF 50+) every single day, as any sun exposure will darken the patches. Consult a dermatologist for skin-lightening creams if it doesn't fade naturally."
  },
  {
    problem: "Skin Tags",
    symptoms: "Small, soft, skin-colored growths that hang off the skin by a thin stalk, usually found on the neck, armpits, or around the groin. They are painless.",
    solution: "They are completely harmless and do not require treatment. If they constantly catch on clothing or jewelry, a GP or dermatologist can safely remove them by freezing (cryotherapy) or snipping them off. Do not attempt to cut them off yourself."
  },
  {
    problem: "Tooth Decay",
    symptoms: "Toothache, sharp pain when eating or drinking sweet, hot, or cold things, visible holes or pits in your teeth, brown or black staining.",
    solution: "Requires a dentist visit for a filling or crown. Prevent further decay by brushing twice daily with fluoride toothpaste, flossing daily, and cutting down on sugary snacks and drinks."
  },
  {
    problem: "Gingivitis",
    symptoms: "Red, puffy, or swollen gums that bleed easily when you brush or floss your teeth. Bad breath.",
    solution: "Reversible with good oral hygiene. Brush twice a day, floss daily to remove plaque between teeth, and use an antiseptic mouthwash. Schedule a professional dental cleaning."
  },
  {
    problem: "Periodontitis",
    symptoms: "Receding gums (teeth look longer), loose or shifting teeth, persistent bad breath, deep pockets forming between the gums and teeth.",
    solution: "Requires professional dental intervention (deep scaling and root planing). Stop smoking immediately, as it is a major risk factor. Maintain strict at-home oral hygiene."
  },
  {
    problem: "Mouth Ulcers",
    symptoms: "Small, painful, shallow sores with a white or yellow center and a red border, found on the inside of the lips, cheeks, or gums.",
    solution: "Usually heal on their own in 1-2 weeks. Avoid spicy, salty, or acidic foods that cause stinging. Use an over-the-counter antimicrobial mouthwash or a numbing gel."
  },
  {
    problem: "Halitosis",
    symptoms: "A constant unpleasant odor from the breath that does not go away after brushing. Often accompanied by a white coating on the tongue.",
    solution: "Brush your tongue or use a tongue scraper. Floss daily to remove trapped, rotting food particles. Drink plenty of water to prevent dry mouth. If it persists, see a dentist to check for gum disease."
  },
  {
    problem: "Dry Mouth",
    symptoms: "A sticky, dry feeling in the mouth, thick stringy saliva, difficulty chewing or swallowing, cracked lips, and a rough tongue.",
    solution: "Sip water frequently throughout the day. Chew sugar-free gum to stimulate saliva production. Limit caffeine, alcohol, and tobacco. Use over-the-counter artificial saliva sprays if necessary."
  },
  {
    problem: "Bruxism",
    symptoms: "Waking up with a dull headache or sore jaw, flattened or chipped teeth, increased tooth sensitivity, tired jaw muscles.",
    solution: "Get a custom-fitted nightguard from your dentist to protect your teeth while you sleep. Practice stress-relief techniques like yoga or meditation. Cut back on caffeine in the evenings."
  },
  {
    problem: "Sensitive Teeth",
    symptoms: "A sudden, sharp flash of pain when teeth are exposed to cold air, hot drinks, sweet foods, or when brushing.",
    solution: "Switch to a desensitizing toothpaste (like Sensodyne) and use a soft-bristled toothbrush. Brush gently. Avoid highly acidic foods (like citrus) that erode tooth enamel."
  },
  {
    problem: "Dental Abscess",
    symptoms: "Severe, constant, throbbing toothache that can spread to the jaw or neck. Swelling in the face or cheek, fever, and a foul-tasting fluid in your mouth if it bursts.",
    solution: "Requires emergency dental care. You will likely need antibiotics and a root canal or extraction. While waiting for the dentist, rinse your mouth with warm salt water and take painkillers."
  },
  {
    problem: "Impacted Wisdom Teeth",
    symptoms: "Pain, swelling, and redness at the very back of the mouth/jaw. Difficulty opening the mouth fully, bad taste when biting down.",
    solution: "Rinse with warm salt water to keep the inflamed gums clean. Take ibuprofen to reduce pain and swelling. Consult a dentist to see if the teeth need to be surgically removed."
  },
  {
    problem: "TMJ Disorder",
    symptoms: "A clicking, popping, or grating sound when opening or closing your mouth. Pain in the jaw joint, earaches, and difficulty chewing.",
    solution: "Eat soft foods and avoid chewing gum. Apply a warm, damp cloth or ice pack to the side of your face. Gently massage the jaw muscles."
  },
  {
    problem: "Geographic Tongue",
    symptoms: "Smooth, red, irregular patches on the top or sides of the tongue. The patches often have white borders and change size or location over time.",
    solution: "It is a harmless condition that usually requires no treatment. If the tongue feels sore or burns, avoid hot, spicy, acidic, or highly processed foods until the flare-up passes."
  },
  {
    problem: "Black Hairy Tongue",
    symptoms: "The tongue looks dark (brown or black) and furry/hairy. Often accompanied by bad breath or a metallic taste in the mouth.",
    solution: "It looks alarming but is harmless. Gently brush your tongue twice a day or use a tongue scraper to remove dead cells and bacteria. Quit smoking and drink more water."
  },
  {
    problem: "Glossitis",
    symptoms: "The tongue becomes swollen, changes color (often dark red), and the surface appears completely smooth rather than bumpy. It can be painful to swallow or speak.",
    solution: "Often caused by a nutritional deficiency (like low Vitamin B12 or iron) or an allergic reaction. Eat a balanced diet. Avoid irritants like alcohol, tobacco, and spicy foods."
  },
  {
    problem: "Burning Mouth Syndrome",
    symptoms: "A daily scalding or burning sensation on the tongue, lips, or the roof of the mouth, as if you burned it on hot coffee. Often includes a bitter or metallic taste.",
    solution: "Sip cold water or suck on crushed ice to relieve the burn. Avoid acidic foods (tomatoes, citrus), cinnamon, and alcohol-based mouthwashes. See a doctor, as it can be linked to nerve damage or hormonal changes."
  },
  {
    problem: "Leukoplakia",
    symptoms: "Thick, white, or greyish patches forming on the gums, the insides of your cheeks, or the bottom of the mouth. The patches cannot be scraped off.",
    solution: "Stop smoking or chewing tobacco immediately, and severely limit alcohol. Most patches are non-cancerous, but a dentist or doctor must evaluate them to rule out early signs of oral cancer."
  },
  {
    problem: "Cracked Tooth Syndrome",
    symptoms: "Erratic pain when chewing, especially when releasing the biting pressure. Pain when eating hot or cold foods, but the tooth may look perfectly fine.",
    solution: "Chew on the other side of your mouth. See a dentist as soon as possible. The tooth will likely need a crown to bind it together and prevent the crack from spreading to the root."
  },
  {
    problem: "Denture Stomatitis",
    symptoms: "Redness, swelling, and soreness on the roof of the mouth or the gums that sit directly underneath dentures. Often caused by a yeast infection.",
    solution: "Leave your dentures out at night to let your gums rest. Clean the dentures thoroughly every single day with a proper denture brush and cleanser. See a dentist for an antifungal prescription."
  },
  {
    problem: "Angular Cheilitis",
    symptoms: "Red, swollen, cracked, and painful sores specifically at the corners of the mouth. They may bleed or form a crust when you open your mouth wide.",
    solution: "Keep the corners of your mouth dry; do not lick your lips. Apply a thick lip balm or petroleum jelly. If it doesn't heal, a doctor may need to prescribe an antifungal or antibiotic cream."
  },
  {
    problem: "Mucocele",
    symptoms: "A clear or bluish, painless, fluid-filled bump usually found on the inner lower lip, cheeks, or the floor of the mouth. Often caused by biting the lip.",
    solution: "These are harmless and often burst and heal on their own over a few weeks. Do not try to pop or pierce it yourself, as this causes infection. If it keeps returning, a dentist can safely remove it."
  },
  {
    problem: "Rheumatoid Arthritis",
    understanding: "An autoimmune disease where the body's immune system mistakenly attacks the lining of the joints, causing chronic inflammation and potential joint damage.",
    symptoms: "Warm, swollen, and stiff joints (especially in the mornings), extreme fatigue, and symptoms appearing on both sides of the body simultaneously (e.g., both wrists).",
    solution: "See a rheumatologist for diagnosis. Treatment usually involves Disease-Modifying Antirheumatic Drugs (DMARDs) to slow the disease, alongside gentle exercises like swimming to keep joints flexible."
  },
  {
    problem: "Osteoporosis",
    understanding: "A condition that weakens bones, making them fragile and more likely to break. It develops slowly over several years and is often only diagnosed when a fall or sudden impact causes a bone fracture.",
    symptoms: "Often no early symptoms. Later signs include back pain caused by a fractured or collapsed vertebra, loss of height over time, or a bone breaking much more easily than expected.",
    solution: "Engage in weight-bearing exercises (like walking or lifting weights). Ensure adequate calcium and Vitamin D intake. Doctors may prescribe bone-strengthening medications like bisphosphonates."
  },
  {
    problem: "Muscle Strain",
    understanding: "Commonly known as a \"pulled muscle,\" this occurs when a muscle or its attaching tendon is overstretched or torn, usually due to fatigue, overuse, or improper use.",
    symptoms: "Sudden onset of pain, soreness, limited range of movement, bruising or discoloration, and swelling in the affected muscle.",
    solution: "Follow the R.I.C.E protocol (Rest, Ice, Compression, Elevation) for the first 48 hours. Take over-the-counter anti-inflammatory painkillers. Seek medical help if you cannot move the muscle at all."
  },
  {
    problem: "Fibromyalgia",
    understanding: "A chronic long-term condition that causes widespread pain and tenderness all over the body. It alters the way the brain and spinal cord process pain signals, amplifying them.",
    symptoms: "Widespread aching pain, extreme tiredness (fatigue), muscle stiffness, difficulty sleeping, and \"fibro fog\" (problems with memory and concentration).",
    solution: "Treatment focuses on symptom management. Doctors often recommend a combination of aerobic exercise, cognitive behavioral therapy (CBT), and occasionally antidepressants or anti-seizure drugs to reduce nerve pain."
  },
  {
    problem: "Tendonitis",
    understanding: "Inflammation or irritation of a tendon (the thick fibrous cords that attach muscle to bone). It is most commonly caused by repetitive, minor impact on the affected area.",
    symptoms: "A dull ache when moving the affected limb or joint, tenderness, and mild swelling. Often occurs in shoulders, elbows, wrists, knees, and heels.",
    solution: "Rest the affected area and avoid the activity that caused the injury. Apply ice packs for up to 20 minutes a day. If it doesn't improve in a few weeks, a doctor may suggest physical therapy or corticosteroid injections."
  },
  {
    problem: "Bursitis",
    understanding: "Inflammation of the bursae, which are small, fluid-filled sacs that act as cushions between bones and the overlying soft tissues (like muscles and tendons).",
    symptoms: "The affected joint feels achy or stiff, hurts more when you press on it or move it, and looks swollen and red. Common in shoulders, elbows, and hips.",
    solution: "Rest the joint and use ice to reduce swelling. Take ibuprofen to manage pain and inflammation. Protect the joint from pressure (e.g., use knee pads if kneeling). See a doctor if the swelling is severe or hot to the touch."
  },
  {
    problem: "Herniated Disc",
    understanding: "Also known as a \"slipped disc,\" this happens when the soft inner cushion of a spinal disc pushes out through a crack in the tougher exterior casing, irritating nearby nerves.",
    symptoms: "Arm or leg pain (depending on where the disc is), numbness or tingling radiating to the limbs, and unexplained muscle weakness in the affected area.",
    solution: "Avoid activities that worsen the pain. Stay relatively active with gentle walks; excessive bed rest can make it worse. Doctors may prescribe muscle relaxants, physical therapy, or in severe cases, surgery."
  },
  {
    problem: "Achilles Tendinopathy",
    understanding: "An overuse injury of the Achilles tendon, the band of tissue that connects calf muscles at the back of the lower leg to your heel bone. Common in runners.",
    symptoms: "A mild ache in the back of the leg or above the heel after running or sports. Morning tenderness or stiffness that usually improves with mild activity.",
    solution: "Decrease the intensity of your exercise. Stretch your calf muscles daily. Wear supportive shoes. A physical therapist may recommend specific eccentric strengthening exercises for the calf."
  },
  {
    problem: "Muscle Cramps",
    understanding: "A sudden, involuntary, and painful contraction of one or more of your muscles. Often called a \"charley horse,\" they commonly occur in the legs, especially at night.",
    symptoms: "A sudden, sharp pain in the muscle, followed by a hard, visible lump of muscle tissue beneath the skin.",
    solution: "Gently stretch and massage the cramping muscle. Apply heat to tense muscles or cold if the muscle is tender. Ensure you are well-hydrated and have enough electrolytes (potassium, magnesium) in your diet."
  },
  {
    problem: "Tennis Elbow",
    understanding: "A condition called Lateral Epicondylitis, caused by the overuse of the muscles and tendons of the forearm, leading to inflammation around the outside of the elbow.",
    symptoms: "Pain or burning on the outer part of your elbow, and a weak grip strength. The pain often gets worse when twisting the forearm or gripping objects (like a doorknob or a coffee cup).",
    solution: "Rest the arm and apply ice. Wear a counterforce brace on the forearm to relieve tension on the tendon. Physical therapy to strengthen the forearm muscles is highly recommended by doctors."
  },
  {
    problem: "Golfers Elbow",
    understanding: "Known as Medial Epicondylitis, this is similar to tennis elbow but affects the tendons on the inside of the elbow. It is caused by repetitive wrist and finger clenching.",
    symptoms: "Pain and tenderness on the inner side of the elbow, which can radiate down the inner forearm. Stiffness in the elbow and numbness or tingling in the ring and little fingers.",
    solution: "Stop the repetitive action causing the pain. Use a cold compress. Over-the-counter pain relievers can help. A doctor may suggest a specialized elbow strap and specific stretching routines."
  },
  {
    problem: "Shin Splints",
    understanding: "Medial tibial stress syndrome, involving inflammation of the muscles, tendons, and bone tissue around your tibia (shinbone). Very common in runners and dancers.",
    symptoms: "A dull, aching pain down the front of the lower legs. Pain develops during exercise and can linger afterward. Mild swelling in the lower leg.",
    solution: "Rest and avoid high-impact activities; switch to swimming or cycling temporarily. Apply ice to the shins for 15 minutes after exercise. Replace worn-out running shoes and consider orthotic inserts."
  },
  {
    problem: "Rotator Cuff Injury",
    understanding: "A tear or inflammation in the group of muscles and tendons that surround the shoulder joint, keeping the head of your upper arm bone firmly within the shallow socket of the shoulder.",
    symptoms: "A dull ache deep in the shoulder, pain that disturbs sleep (especially if lying on the affected side), and arm weakness when lifting or reaching.",
    solution: "Rest the shoulder and avoid overhead activities. Use physical therapy to restore flexibility and strengthen the shoulder muscles. Corticosteroid injections or surgery may be required for severe tears."
  },
  {
    problem: "Meniscus Tear",
    understanding: "A tear in the C-shaped cartilage that acts like a shock absorber between your shinbone and thighbone in the knee. Often caused by forcefully twisting or rotating the knee.",
    symptoms: "A popping sensation during the injury, swelling, stiffness, pain when twisting the knee, and feeling like the knee is \"locked\" in place or giving way.",
    solution: "R.I.C.E (Rest, Ice, Compression, Elevation) is the first step. Avoid squatting or pivoting. Doctors may recommend physical therapy or, if the knee remains locked, arthroscopic surgery to trim or repair the tear."
  },
  {
    problem: "Trigger Finger",
    understanding: "A condition where one of your fingers gets stuck in a bent position. Your finger may bend or straighten with a sudden snap, like a trigger being pulled and released, due to inflammation narrowing the space around the tendon.",
    symptoms: "Finger stiffness (especially in the morning), a popping or clicking sensation as you move the finger, and a tender lump at the base of the affected finger on the palm side.",
    solution: "Rest the finger and use a splint at night to keep it straight. Gentle stretching exercises. Doctors often recommend a steroid injection into the tendon sheath to reduce inflammation."
  },
  {
    problem: "Bunions",
    understanding: "A bony bump that forms on the joint at the base of your big toe. It forms when your big toe pushes against your next toe, forcing the joint of your big toe to get bigger and stick out.",
    symptoms: "A bulging bump on the outside of the base of your big toe, swelling, redness, soreness, and restricted movement of your big toe.",
    solution: "Wear roomy, comfortable shoes with a wide toe box (avoid high heels or pointy shoes). Use over-the-counter bunion pads or cushions to prevent rubbing. Severe cases causing daily pain may require surgery."
  },
  {
    problem: "Flat Feet",
    understanding: "Also known as fallen arches, this is a condition where the entire soles of your feet touch the floor when you stand up. It can occur if arches don't develop in childhood, or after an injury/wear-and-tear.",
    symptoms: "Often painless, but can cause pain in the heel or arch area. Pain may worsen with activity. Can lead to swelling along the inside of the ankle and contribute to knee or back pain.",
    solution: "If it causes no pain, no treatment is needed. If painful, doctors recommend custom-designed arch supports (orthotics) inserted into your shoes, and stretching exercises for the Achilles tendon."
  },
  {
    problem: "Ankylosing Spondylitis",
    understanding: "A rare type of arthritis that causes pain and stiffness in your spine. Over time, this inflammatory disease can cause some of the small bones in your spine (vertebrae) to fuse together, making the spine less flexible.",
    symptoms: "Pain and stiffness in the lower back and hips, especially in the morning and after periods of inactivity. Fatigue and neck pain. Pain improves with exercise and worsens with rest.",
    solution: "Requires a rheumatologist's care. Treatment includes physical therapy to maintain posture and flexibility, and medications like NSAIDs or biologic therapies (like TNF blockers) to reduce inflammation."
  },
  {
    problem: "Ganglion Cyst",
    understanding: "Noncancerous, fluid-filled lumps that most commonly develop along the tendons or joints of your wrists or hands. They look like small water balloons beneath the skin.",
    symptoms: "A visible lump on the wrist or hand that may change in size. Usually painless, but if the cyst presses on a nerve, it can cause pain, tingling, or muscle weakness.",
    solution: "If it causes no pain, doctors usually recommend \"watchful waiting\" as they often disappear on their own. If painful, a doctor can drain the fluid with a needle (aspiration) or surgically remove it. Do not hit it with a heavy object (a dangerous old home remedy)."
  },
  {
    problem: "Whiplash",
    understanding: "A neck injury due to forceful, rapid back-and-forth movement of the neck, like the cracking of a whip. Most commonly caused by rear-end car accidents.",
    symptoms: "Neck pain and stiffness, worsening of pain with neck movement, loss of range of motion in the neck, headaches (usually starting at the base of the skull), and tenderness in the shoulders.",
    solution: "Rest the neck for the first 24 hours, applying ice/heat. Continue to perform gentle, prescribed neck movements; prolonged use of a foam neck collar is no longer recommended. Seek emergency care if pain spreads down the arms or causes numbness."
  },
  {
    problem: "Fever / High Temperature",
    understanding: "A fever is a temporary increase in body temperature, usually indicating that the body's immune system is actively fighting off an underlying infection (such as a virus or bacteria).",
    symptoms: "Sweating, chills and shivering, headaches, muscle aches, loss of appetite, general lethargy/weakness, and dehydration.",
    solution: "Get plenty of rest and drink lots of clear fluids (like water or broth) to prevent dehydration. Use over-the-counter medications like paracetamol or ibuprofen to lower the temperature and ease aches. Seek immediate medical attention if the fever reaches 39.4°C (103°F) or higher."
  },
  {
    problem: "Cough",
    understanding: "A reflex action to clear the airways of mucus, irritants, or foreign particles.",
    symptoms: "Persistent hacking, a tickling sensation in the back of the throat, bringing up clear, yellow, or green mucus, and chest soreness from repeated coughing.",
    solution: "Stay hydrated and drink warm water with honey and lemon (for adults and older children) to soothe the throat. See a doctor if the cough lasts more than three weeks."
  },
  {
    problem: "Fatigue / Tiredness",
    understanding: "A lingering tiredness that is constant and limiting. Often caused by lifestyle factors (stress, overwork) or underlying conditions.",
    symptoms: "A profound lack of energy, \"brain fog,\" feeling unrefreshed even after a full night's sleep, and feeling like your limbs are heavy.",
    solution: "Improve sleep hygiene, eat a balanced diet, and engage in gentle, regular exercise. See a GP if the extreme tiredness persists for several weeks."
  },
  {
    problem: "Nausea and Vomiting",
    understanding: "Nausea is the uncomfortable feeling of being sick to your stomach; vomiting is the physical expulsion of stomach contents.",
    symptoms: "Queasiness, excess saliva, stomach discomfort, gagging, and bringing up food or bile.",
    solution: "Sip clear fluids (like water or oral rehydration solutions) very slowly. Avoid solid food until the stomach settles. Seek urgent help if you are unable to keep any water down for 24 hours."
  },
  {
    problem: "Diarrhoea",
    understanding: "Passing looser or more frequent stools than normal. Most commonly caused by a viral stomach bug or food poisoning.",
    symptoms: "Watery stools, stomach cramps, a sudden urgency to go to the toilet, and sometimes accompanied by mild nausea or a low-grade fever.",
    solution: "Hydration is critical. Drink oral rehydration solutions to replace lost salts. Eat plain, bland foods (like toast or plain rice) when you feel hungry again. Stay home for 48 hours after the last episode."
  },
  {
    problem: "Sore Throat",
    understanding: "Inflammation of the back of the throat (pharyngitis), most commonly caused by viral infections like the common cold.",
    symptoms: "A painful, dry, or scratching sensation in the throat, pain that worsens noticeably when swallowing, and slightly swollen neck glands.",
    solution: "Gargle with warm salty water (adults only). Suck on throat lozenges or hard boiled sweets. See a GP if it doesn't improve after a week or if you cannot swallow liquids."
  },
  {
    problem: "Earache",
    understanding: "Pain in the ear, often due to an infection in the middle ear, a buildup of fluid, or a side effect of a severe cold.",
    symptoms: "Sharp, dull, or burning pain in one or both ears, muffled hearing, a feeling of pressure, or fluid draining from the ear canal.",
    solution: "Use over-the-counter pain relief like paracetamol. Place a warm flannel gently against the affected ear. Do not stick cotton buds inside the ear."
  },
  {
    problem: "Dizziness",
    understanding: "A feeling of being lightheaded, unsteady, or as if the room is spinning (vertigo). Frequently caused by dehydration or inner ear problems.",
    symptoms: "Feeling faint, losing your balance, general wooziness, or feeling the need to hold onto something to stand up straight.",
    solution: "Sit or lie down immediately to prevent falling. Drink a large glass of water. Avoid sudden movements. If it happens frequently, seek medical advice."
  },
  {
    problem: "Heartburn / Acid Reflux",
    understanding: "Stomach acid traveling the wrong way up towards the throat, causing an irritating, burning sensation in the middle of the chest.",
    symptoms: "A burning feeling in the chest (usually right after eating), a sour or bitter taste in the back of the mouth, and feeling bloated or burping frequently.",
    solution: "Eat smaller, more frequent meals. Avoid triggers like spicy, fatty, or highly acidic foods. Do not lie down immediately after eating."
  },
  {
    problem: "Dehydration",
    understanding: "Occurs when your body loses more fluids than you take in, meaning your body doesn't have enough water and essential salts.",
    symptoms: "Feeling very thirsty, passing dark yellow and strong-smelling pee, feeling dizzy or lightheaded, and having a dry mouth, lips, and eyes.",
    solution: "Drink fluids immediately (water, diluted squash, or specialized rehydration drinks). Avoid caffeine and alcohol. See a doctor urgently if you feel unusually confused."
  },
  {
    problem: "Hiccups",
    understanding: "Involuntary spasms of the diaphragm muscle, followed by a sudden closure of the vocal cords.",
    symptoms: "Repeated, uncontrollable, rhythmic spasms in the chest and throat area.",
    solution: "They are almost always harmless. Home remedies include drinking a glass of cold water slowly, holding your breath for a short time, or breathing into a paper bag."
  },
  {
    problem: "Nosebleeds",
    understanding: "Bleeding from the delicate blood vessels in the inner lining of the nose (epistaxis).",
    symptoms: "Blood dripping or flowing steadily from one or both nostrils.",
    solution: "Sit upright and lean slightly forward. Firmly pinch the soft part of your nose just above your nostrils for 10 to 15 minutes. Go to A&E if the bleeding lasts more than 20 minutes."
  },
  {
    problem: "Motion Sickness",
    understanding: "A conflict between the senses (eyes see stationary, inner ear feels movement), causing the brain to trigger nausea.",
    symptoms: "Queasiness, breaking out in cold sweats, dizziness, excessive yawning, and vomiting while traveling.",
    solution: "Look straight ahead at a fixed point on the horizon. Open a window to get fresh air. Take over-the-counter motion sickness tablets before traveling."
  },
  {
    problem: "Muscle Twitching",
    understanding: "Small, involuntary, and localized muscle contractions (fasciculations).",
    symptoms: "A fast, fluttering, or pulsing sensation in a specific muscle that is annoying but completely painless.",
    solution: "Usually caused by stress, anxiety, lack of sleep, or excess caffeine. Reduce your caffeine intake, get more rest, and stay hydrated."
  },
  {
    problem: "Bruising",
    understanding: "Discoloration of the skin caused by blood leaking from damaged capillaries under the skin.",
    symptoms: "A patch of skin that initially turns red, then dark blue/purple, and eventually fades to yellow/green. It is tender to the touch.",
    solution: "Apply an ice pack wrapped in a cloth for 10-15 minutes immediately after the injury to reduce swelling and bleeding."
  },
  {
    problem: "Bloating",
    understanding: "A feeling of a full, tight, and swollen abdomen. Often caused by excess gas production in the gut.",
    symptoms: "The tummy feels physically stretched or uncomfortable, visible swelling of the abdomen, and excessive burping or passing of wind.",
    solution: "Eat slowly and chew your food very well. Avoid fizzy drinks and known gas-producing foods. Gentle exercise after eating can help."
  },
  {
    problem: "Excessive Sweating",
    understanding: "Sweating much more than the body requires to simply regulate its temperature (hyperhidrosis).",
    symptoms: "Visibly wet patches on clothing, constantly sweaty or clammy palms, and sweating heavily even when resting in a cool room.",
    solution: "Wear loose, breathable fabrics like cotton or linen. Use strong antiperspirants. Speak to a GP if it severely impacts your daily life."
  },
  {
    problem: "Insomnia",
    understanding: "Difficulty falling asleep or staying asleep. Temporary insomnia is usually triggered by stress, jet lag, or poor sleep habits.",
    symptoms: "Lying awake for long periods at night, waking up multiple times and struggling to get back to sleep.",
    solution: "Establish a strict, relaxing bedtime routine. Avoid screens, caffeine, or heavy meals right before bed. Ensure the bedroom is dark, quiet, and cool."
  }
];

async function ingest() {
  console.log(`[Ingest] Processing ${chunks.length} custom medical chunks...`);
  
  for (const chunk of chunks) {
    const text = `Problem: ${chunk.problem}. Symptoms: ${chunk.symptoms}. Solution: ${chunk.solution}.${chunk.understanding ? ' Understanding: ' + chunk.understanding : ''}`;
    try {
      await processRawText(USER_ID, text, 'user_manual_training');
      process.stdout.write('.');
    } catch (err) {
      console.error(`\n[Ingest] Error processing ${chunk.problem}:`, err.message);
    }
  }
  
  console.log('\n[Ingest] All chunks processed and saved to training corpus.');
  console.log('[Ingest] The vector store will be updated automatically on the next chat query.');
}

ingest();
