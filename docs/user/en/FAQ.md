# Tilo Frequently Asked Questions (FAQ)

> 简体中文版 → [../zh-CN/FAQ.md](../zh-CN/FAQ.md)

---

### 1. What is the difference between a Task and a Session?
**Answer**: A Task represents an intended outcome (what you aim to accomplish), while a Session records an actual slice of focused time (the real time spent). A complex task can span multiple sessions across multiple days before being marked completed.

---

### 2. What is the difference between Due Date and Scheduled Date?
**Answer**: Due Date is the latest hard deadline by which a task must be finished. Scheduled Date is the calendar day you intend to execute it. For example, a report is due August 30 (`Due Date`), but scheduled for August 22 (`Scheduled Date`).

---

### 3. What is the difference between a Scheduled Date and a Planned Block?
**Answer**: A Scheduled Date is a day-level allocation ("I will do this on Friday"). A Planned Block is a precise reservation on the timeline ("I reserve 14:00–15:30 on Friday").

---

### 4. What is the difference between Estimate, Planned Time, and Actual Time?
**Answer**:
- **Estimate**: Total effort expected for the entire task (e.g. 90 minutes).
- **Planned Time**: Duration assigned to a specific planned block on the timeline (e.g. 14:00–15:30 = 90 min).
- **Actual Time**: The sum of active focus seconds tracked during execution (excluding pauses).

---

### 5. Why do Plan and Actual coexist on the timeline?
**Answer**: Tilo believes in presenting execution facts. By rendering ghost dashed plan blocks alongside solid actual blocks, you can objectively observe timeline variance and calibrate your time perception without losing your original schedule.

---

### 6. Is a Focus Block a Task?
**Answer**: No. A Focus Block is a time budget reserved on the calendar for a certain category of work (e.g. "Deep Work" or "Admin"). Tasks can be executed within that budgeted window.

---

### 7. What is the difference between Today view and Calendar Day view?
**Answer**: Today is an **execution workbench** focused on immediate action with 1–3 Focus tasks and Next Up recommendations. Calendar is a **planning horizon center** for multi-day time balancing and capacity review. Both share the same underlying Timeline Engine and database records.

---

### 8. What is the difference between Inbox and Someday?
**Answer**: Inbox holds raw, unsorted captures awaiting triage. Someday holds curated, valuable backlog tasks that currently lack an active time commitment, which automatically resurface during Weekly Review.

---

### 9. Do Background Sessions count towards Active Time?
**Answer**: No. Background sessions (such as running test suites or builds) are tracked separately in analytics so they do not artificially inflate your headline active focus time.

---

### 10. Why can a Task have multiple Sessions?
**Answer**: Real-world execution is rarely done in a single sitting. Large tasks naturally require multiple focus blocks across hours or days. Each timer execution produces its own Session record.

---

### 11. Do Planned Blocks disappear when a task is completed?
**Answer**: No. Historical planned blocks remain on your calendar to provide an authentic audit trail during review.

---

### 12. Is Daily Capacity a mandatory work requirement?
**Answer**: No. Daily Capacity acts purely as a personal time budget guideline. If scheduled time exceeds capacity, Tilo gently highlights the overage without restricting your schedule.

---

### 13. Why does the calendar allow overlapping blocks?
**Answer**: Real life involves concurrent commitments and overlapping tasks. Tilo displays overlapping events side-by-side in neat columns rather than rejecting entries or throwing errors.

---

### 14. Are the accuracy percentages in Analytics a performance score?
**Answer**: Absolutely not. Analytics in Tilo presents objective facts to help you understand your scheduling patterns. There are no performance judgments or moral scores.

---

### 15. Why doesn't the Weekly Snapshot change after I edit a task?
**Answer**: Review snapshots are **strictly immutable**. When a review is sealed, history is preserved as an unalterable record so that future task mutations never corrupt past reporting.

---

### 16. What happens when I Reopen a Review?
**Answer**: Reopening a sealed review creates a new revision (`revision + 1`). All past revisions remain archived and viewable in review history.

---

### 17. Where is Tilo data stored?
**Answer**: All data is stored locally in your browser's IndexedDB database via Dexie.js. No data ever leaves your device.

---

### 18. Will clearing browser history erase my data?
**Answer**: Clearing site storage or cookies will delete your local IndexedDB database. Always export routine JSON backups via **Settings → Data** to keep your data safe.

---

### 19. How do I backup my Tilo data?
**Answer**: Go to **Settings → Data** and click **Export Backup JSON** to download a complete backup archive.

---

### 20. How do I restore my backup?
**Answer**: In **Settings → Data**, upload your `.json` backup file. Tilo validates the data structure using Zod before restoring.

---

### 21. Does Tilo V1 support cloud synchronization?
**Answer**: *Not available in Tilo V1.* V1 is strictly local-first. Use JSON export/import to migrate data between devices.

---

### 22. Does Tilo support Google Calendar or Outlook integration?
**Answer**: *Not available in Tilo V1.*

---

### 23. Does Tilo have native mobile apps?
**Answer**: *Not available in Tilo V1.* Tilo is designed desktop-web-first, with responsive mobile browser support for viewing lists and capture.

---

### 24. How do I reset Today or Analytics layout?
**Answer**: Click **Customize** in the top right of Today or Analytics and click **Reset to Default**.

---

### 25. How do I reduce or disable UI animations?
**Answer**: Go to **Settings → Motion** and select **Reduced**. Tilo also honors your operating system's `prefers-reduced-motion` setting.
