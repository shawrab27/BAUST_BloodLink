# 🩸 BAUST BloodLink
> Intra-campus emergency blood donation and coordination network for Bangladesh Army University of Science and Technology (BAUST), Saidpur Cantonment.

[![Live Web Application](https://img.shields.io/badge/Live_App-baust--blood--link.vercel.app-red?style=for-the-badge&logo=vercel)](https://baust-blood-link.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React_19_+_Node_Express_+_MongoDB-blue?style=for-the-badge)](https://baust-blood-link.vercel.app)

---

## 🌐 Live Reviewer URL
- **Production URL:** [https://baust-blood-link.vercel.app](https://baust-blood-link.vercel.app)

---

## 🔑 Peer Reviewer & Testing Credentials

The login screen includes a **1-click Demo Student Login** autofill bar. You can also manually use these test credentials:

### Demo Student Login (General User & Donor View)
- **Institutional ID:** `210201001`
- **Password:** `Password123!`
- **Role:** Student / Active Blood Donor
- **Destination:** User Community Feed (`/feed`), Blood Hub, Search Donors, Emergency SOS, Helpline, Profile.

---

## 🚀 Key Modules to Test
1. **Feed & Community Posts (`/feed`):** Post creation, like/cheer, comments, filter by department.
2. **Blood Hub (`/blood-hub`):** Active blood requisitions, donor directory search, eligibility pass calculation.
3. **Emergency SOS (`/emergency`):** Live critical dispatch console, hospital radius map, quick hotline.
4. **Donor Search (`/blood-hub/search`):** Search donors by blood group, department, availability status.
5. **Helpline & Medical Center (`/helpline`):** Direct Saidpur CMH and BAUST medical contacts.
6. **Profile Management (`/profile`):** View donor card, donation eligibility countdown, edit contact info.
7. **Admin Command Center (`/admin`):** Live metric cards, feed moderation, user role management, disaster wing volunteers.

---

## 🐛 Bug Reporting & Kanban Board
If you find any bugs, UI glitches, or functional defects during testing:
1. Open this repository's **[Issues](https://github.com/shawrab27/BAUST_BloodLink/issues)** tab.
2. Click **New Issue** with:
   - Steps to reproduce
   - Expected vs Actual behavior
   - Screenshot / Console error log
   - Severity label (`bug`, `critical`, `ui`)
3. Add the issue to the repository's **Projects (Kanban Board)** under the `Todo` column.

---

## 💻 Local Development Setup (Optional)

If you wish to test locally:

```bash
# Clone the repository
git clone https://github.com/shawrab27/BAUST_BloodLink.git
cd BAUST_BloodLink

# Install all dependencies (root, backend api, and frontend client)
npm run install:all

# Run concurrent development servers (API on port 5000, Client on port 5173)
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend Health: `http://localhost:5000/api/health`
