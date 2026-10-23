# Dharam Bhai Learn

Build a professional mobile-first education app called:

DHARAM BHAI STUDY

By Lakshya Prince

IMPORTANT:

- Create an original UI. Do NOT copy the interface, branding, colors, layout, logo, or design of Physics Wallah or any other third-party website.

- Do NOT use fake courses, fake student counts, fake ratings, fake teachers, fake prices, or fake lesson data.

- Do NOT bypass login, verification, CAPTCHA, CORS, DRM, payment protection, or any other security.

- Use only authorized/public course APIs or data sources.

- If an authorized API is unavailable, clearly show “Catalog unavailable” instead of inventing data.

APP STRUCTURE:

1. SPLASH SCREEN

- Dharam Bhai Study logo

- “Learn • Practice • Grow”

- “By Lakshya Prince”

2. HOME

- Search bar

- JEE section

- NEET section

- Featured Courses

- My Learning

- Books & Notes

- Live Classes

- AI Doubt Solver

- Bottom navigation:

  Home | Courses | My Learning | Profile

3. COURSES

Categories:

- JEE

- NEET

Each category must load the COMPLETE available catalog from the authorized/public course source.

Course card:

- Real course thumbnail/cover if supplied by source

- Course name

- Exam/category

- Accurate metadata only

- View Details button

4. COURSE DETAILS

Show only real data returned by the authorized source:

- Course title

- Description

- Teacher/educator if available

- Subjects

- Chapters/modules

- Lessons

- Notes/PDF if authorized

- Course thumbnail

Before enrollment:

- Lock course content

- Show “Enroll Now”

After enrollment:

- Unlock course

- Add course to My Learning

- Save enrollment permanently using authenticated database storage

5. MY LEARNING

- Show ONLY courses the logged-in student has explicitly enrolled in.

- New users must start with zero enrolled courses.

- Enrollment must persist after refresh and login/logout.

- Show progress only when real progress data exists.

6. VIDEO LESSONS

Create a professional video lesson screen.

Under the video add:

“🤖 AI Doubt Solver”

When clicked:

- Open bottom-sheet/chat interface

- Student can type a question

- Show suggested questions

- Show loading state

- Maintain chat history

- Clear chat button

- Close button

Send to backend:

- courseId

- lessonId

- lessonTitle

- authorized lesson context/transcript if available

- current video timestamp if available

- student question

Backend endpoint:

POST /api/ai/doubt

IMPORTANT:

- Never expose an AI API key in frontend code.

- Store secrets only in backend environment variables.

- AI must answer using available lesson context.

- If the context is insufficient, say that it does not have enough information instead of hallucinating.

7. BOOKS & NOTES

- Show only authorized/public PDFs or notes.

- PDF viewer inside the app where technically possible.

- Download/open controls only where permitted.

- No unauthorized copyrighted material.

8. SEARCH

Global search for:

- Courses

- Subjects

- Chapters

- Lessons

- Books/Notes

Use real source data.

Show loading, empty, error and retry states.

9. LOGIN / SIGNUP

Use secure authentication.

Do NOT store plaintext passwords.

Fields:

- Name

- Email

- Password

After signup:

- Create student profile

- Start with zero enrolled courses

- Open Home

10. PROFILE

- Profile information

- My Learning

- Account settings

- Logout

11. DATABASE

Use Firebase Authentication + Firestore if supported.

Suggested structure:

users/{userId}

enrollments/{enrollmentId}

progress/{progressId}

Secure database rules so users can access only their own private data.

12. SOURCE INTEGRATION

The source website is:

https://physicswallahx.vercel.app/

DO NOT simply redirect students to this website.

First inspect whether it exposes an authorized/public API or data endpoint for:

- batches/courses

- subjects

- chapters

- lessons

- videos

- notes

If such an endpoint exists:

- connect through the backend

- support pagination/infinite scrolling

- fetch the complete available catalog

- preserve accurate source data

- map the data into our original Dharam Bhai Study UI

If no authorized/public API exists, DO NOT scrape protected pages and DO NOT bypass CORS/security.

Instead show:

“Course catalog is temporarily unavailable because an authorized data endpoint is required.”

13. BACKEND ARCHITECTURE

Frontend

   ↓

Dharam Bhai Study Backend

   ↓

Authorized/Public Course API

   ↓

Database

AI:

Frontend

   ↓

/api/ai/doubt

   ↓

AI provider using server-side secret

14. DESIGN

Make the UI:

- Premium

- Modern

- Clean

- Mobile-first

- Fast

- Professional education-app style

- Smooth cards and animations

- Proper spacing

- Responsive

- Dark/light friendly

- Original design

Do not make it look like a basic HTML demo.

15. ERROR HANDLING

Implement:

- Loading skeletons

- Empty states

- Network error

- API error

- Retry button

- Course unavailable state

- Video unavailable state

- Notes unavailable state

Never replace missing source data with fake data.

16. IMPORTANT FINAL REQUIREMENT

Build the complete working app structure, including:

- frontend

- backend/API integration structure

- authentication

- database

- enrollment

- course catalog

- course details

- lessons

- video screen

- AI Doubt Solver

- books/notes

- search

- profile

- navigation

- loading/error states

Keep the project ready for Android APK/AAB generation later.

APP NAME:

Dharam Bhai Study

FOOTER:

By Lakshya Prince

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dharam-learn-grow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/78e39df5-63eb-4f50-bedb-2070d2607fb6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
