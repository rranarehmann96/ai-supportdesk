# AI SupportDesk — Complete Guide (Usage + GitHub + Going Live + Improvements)

Ye file 4 hisson mein hai:
1. **Poora project kaise use karna hai** (local pe)
2. **GitHub pe upload kaise karna hai**
3. **Internet pe LIVE kaise karna hai** (free hosting)
4. **Aage kya improvements ho sakti hain**

---

# 1. Poora project kaise use karna hai (local pe)

Agar aap ne pehle se MongoDB Atlas aur Groq API key set up nahi ki, to pehle
`README.md` file dekhein — usme step-by-step guide hai.

Agar wo already ho chuki hai, to bas do terminals chahiye:

**Terminal 1 (backend):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (frontend):**
```bash
cd frontend
npm install
npm run dev
```

Phir browser mein `http://localhost:5173/signup` khol kar business account
banayein. Poora flow (tickets, AI, knowledge base, analytics, team) usi
project mein hai jo aap ne pehle test kiya tha.

**Zaroori:** `.env` files (`backend/.env` aur agar bana ho to
`frontend/.env`) kabhi GitHub pe upload na karein — inme aapke asal
passwords/keys hain. Neeche wale section mein ye khud-ba-khud handle ho
jayega (`.gitignore` already isay rok deta hai).

---

# 2. GitHub pe upload kaise karna hai

## Step 1 — GitHub pe account aur repository banayein
1. **https://github.com** pe account banayein (agar nahi hai).
2. Upar right corner mein **+** icon → **New repository**.
3. Naam dein, jaise `ai-supportdesk`. **Public** ya **Private** — dono chalega.
4. **"Add a README file" ko UNCHECK rakhein** (kyunke humare paas already hai).
5. **Create repository** dabayein. Ek khali repo ka URL milega, jaisay:
   `https://github.com/aapka-username/ai-supportdesk.git`

## Step 2 — Apne local project ko Git se jodain

Project ke **root folder** (`ai-supportdesk`, jahan `backend` aur `frontend`
dono folders hain) mein terminal khol kar ye commands chalayein, ek ek kar ke:

```bash
git init
git add .
git commit -m "Initial commit - AI SupportDesk Phase 1, 2 and 3"
git branch -M main
git remote add origin https://github.com/aapka-username/ai-supportdesk.git
git push -u origin main
```

(`aapka-username` ki jagah apna asal GitHub username/repo URL daalein —
wo URL jo Step 1 mein mila tha.)

Agar `git` command hi na mile, to pehle **https://git-scm.com/downloads**
se install karein.

## Step 3 — Confirm karein

GitHub pe apni repo ka page refresh karein — saari files nazar aani
chahiye, **lekin `.env` files bilkul nahi honi chahiyen** (agar dikh jayein
to turant delete karein aur password reset kar lein, security ke liye).

## Aage se update kaise karein

Jab bhi code mein koi change karein aur usay GitHub pe bhejna ho:

```bash
git add .
git commit -m "yahan likhein kya change kiya"
git push
```

---

# 3. Internet pe LIVE kaise karna hai (bilkul free)

Live karne ke liye do alag jagah chahiye — ek **backend** (server) ke liye,
ek **frontend** (website) ke liye. MongoDB pehle se cloud pe hai (Atlas),
isliye usay chhedne ki zaroorat nahi.

## A) Backend ko Render pe deploy karein (free)

1. **https://render.com** pe apne GitHub account se sign up karein.
2. Dashboard mein **New +** → **Web Service**.
3. Apni GitHub repo (`ai-supportdesk`) select karein aur connect karein.
4. Settings mein:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Neeche **Environment Variables** section mein apni `backend/.env`
   file ke saare variables ek ek kar ke add karein:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `GROQ_API_KEY`
   - `PORT` → `5000` daal dein (Render khud bhi apna PORT deta hai, koi
     masla nahi)
   - `CLIENT_URL` → abhi placeholder rakhein, jaise `http://localhost:5173`
     (isay Step B ke baad update karenge)
   - `SMTP_*` → agar email set up ki thi to wo bhi
6. **Create Web Service** dabayein. Deploy hone mein 2-5 minute lagenge.
7. Deploy hone ke baad Render aapko ek URL dega, jaisay:
   `https://ai-supportdesk-backend.onrender.com`
   **Ye URL copy kar lein — agle step mein chahiye.**

**Note:** Render ka free tier thora "so" ho jata hai agar 15 minute koi
use na kare — pehli request pe 30-50 second lag sakte hain jagne mein. Ye
normal hai, koi ghalti nahi.

## B) Frontend ko Vercel pe deploy karein (free)

1. **https://vercel.com** pe apne GitHub account se sign up karein.
2. **Add New** → **Project** → apni `ai-supportdesk` repo import karein.
3. Settings mein:
   - **Root Directory**: `frontend`
   - Framework: Vite (Vercel khud detect kar lega)
4. **Environment Variables** mein add karein:
   - `VITE_API_URL` → wahi Render wala backend URL jo Step A mein mila
     (jaise `https://ai-supportdesk-backend.onrender.com`)
5. **Deploy** dabayein. 1-2 minute mein aapko ek live URL milega, jaisay:
   `https://ai-supportdesk.vercel.app`

## C) Dono ko aapas mein jodain (zaroori step!)

Ab Render (backend) pe wapis jayein:
1. **Environment** tab mein `CLIENT_URL` ko update karein — Vercel wala
   asal URL daal dein (jaise `https://ai-supportdesk.vercel.app`).
2. Save karein — Render khud restart kar dega backend ko.

Isके bina CORS error aayega aur frontend backend se baat nahi kar payega.

## D) Test karein

Apna Vercel wala live URL kholein aur signup try karein. Agar sab sahi
hai to poora app — AI features, knowledge base, analytics, team, sab kuch
— ab kisi ke sath bhi share kiya ja sakta hai, sirf link bhej kar.

---

# 4. Aage kya improvements ho sakti hain

Project abhi core features ke sath complete hai. Agar aage le jana chahein
to yahan kuch achi directions hain, aasan se mushkil tak:

**Aasan (chhote improvements):**
- Agent apne ticket list mein **search bar** add karein (subject/customer
  naam se dhoondne ke liye)
- Har ticket pe "assigned agent" dikhana aur dashboard pe filter karna
- Dark mode toggle

**Darmiyana:**
- **Canned responses** — agent ke liye pehle se likhe hue jawab, ek click
  mein insert ho jayein
- **Internal notes** — ticket pe aisi note likhna jo sirf agents dekhein,
  customer ko nazar na aaye
- Agent ko sirf apne assigned tickets dikhana (permission-based view)
- Ticket auto-close agar "resolved" hone ke 3 din baad koi reply na aaye

**Mushkil (bara kaam, lekin zabardast feature):**
- **File/image attachments** chat mein (Cloudinary jaisi free service se)
- **Multi-language support** — customer ki zaban detect kar ke AI usi mein
  jawab de
- **Slack/WhatsApp integration** — naya ticket aane pe Slack channel mein
  notification
- Proper **rate limiting aur abuse protection** production ke liye
- **Custom domain** apni company ke naam se (jaise support.aapkicompany.com)

Jab bhi in mein se koi feature banana ho, bata dein — hum isi tarah step by
step bana lenge.
