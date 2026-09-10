# Software Requirements Specification (SRS) & Stakeholder Interview Mapping
**Project Name:** BAUST BloodLink
**Target Domain:** blood.baust.edu.bd
**Document Identifier:** SRS-BL-2026-V1
**Course:** Software Engineering Lab (Level 3, Term I)
**Institution:** Bangladesh Army University of Science and Technology (BAUST)
**Repository Issue Reference:** #1

## 1. Stakeholder Interview Mapping
* **Students & Donors:** Highlighted privacy concerns and notification delays on social platforms. Need instant alerts for their specific blood group.
* **Campus Medical Center:** Sub-Assistant Medical Officer required pre-screened donor verification and direct hotline escalation during accidents.
* **System Administrators:** Required institutional ID regex checks to block fake blood requests and unverified outside users.

## 2. Functional Requirements (FR)
* **FR-01 (Campus ID Regex Validation):** Validates 9-digit student IDs ([0-9]{9}$) and staff IDs ((FAC|STF)-[0-9]{4,6}$).
* **FR-02 (Institutional Email Constraint):** Must match *@baust.edu.bd domain.
* **FR-03 (Donor Management):** Availability toggle, cooldown calculator (90 days), and Disaster Reserve opt-in.
* **FR-04 (Emergency SOS & Escalation):** Sub-500ms Socket.io dispatch to matched blood group rooms with fallback to campus feed and direct call button.
* **FR-05 (Campus Help Feed):** Paginated community board for non-urgent blood appeals and voluntary drives.

## 3. Non-Functional Requirements (NFR)
* **NFR-01 (Performance):** Real-time Socket.io SOS propagation under 500 ms; query latency under 150 ms.
* **NFR-02 (Security):** Bcrypt password hashing, JWT authentication, Helmet HTTP headers, rate limiting.
* **NFR-03 (Reliability):** 99.9%% target uptime during semester and exam periods with automatic HTTP polling fallback.

## 4. Traceability Matrix
* **Issue #1:** Requirements Specification (docs/requirements.md)
* **Issue #3:** Use Case Diagram (uml/use_case_diagram.png)
* **Issue #4:** Activity Diagram (uml/activity_diagram.png)
* **Issue #5:** Class Diagram (uml/class_diagram.png)
* **Issue #6:** Sequence Diagram (uml/sequence_diagram.png)
