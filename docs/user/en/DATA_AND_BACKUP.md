# Tilo Data Persistence & Backup Guide (Data & Backup)

> 简体中文版 → [../zh-CN/DATA_AND_BACKUP.md](../zh-CN/DATA_AND_BACKUP.md)

---

## 1. Local-First Architecture

Tilo is engineered strictly under **local-first** principles:
- **Storage Engine**: All goals, projects, tasks, planned blocks, focus sessions, review snapshots, and settings reside in your browser's local **IndexedDB database (managed via Dexie.js)**.
- **No Cloud Dependencies**: Tilo V1 has **no external backend, cloud database, or third-party telemetry**. Your data remains 100% private on your own device.

---

## 2. Browser Data Risk

> [!WARNING]
> **Important Safety Note**:
> Because data is stored in browser-managed local storage, actions such as **"Clear Browsing Data / Clear Site Cookies and Storage / Reset Browser"** will erase your local IndexedDB records.

### How to Protect Your Data:
1. **Avoid long-term usage in Incognito / Private Browsing mode**: Many browsers automatically discard all IndexedDB records upon closing private windows.
2. **Export routine JSON backups**: We strongly recommend exporting a JSON backup periodically (e.g. weekly or monthly) and storing it in your local folder or personal cloud drive.

---

## 3. Exporting Full Workspace Backup

1. Navigate to **Settings** in the bottom left sidebar and open the **Data** tab.
2. Click **Export Backup JSON**.
3. Your browser will prompt to download a standard JSON file (e.g. `tilo-backup-YYYY-MM-DD.json`).
4. The backup archive encapsulates all 23 database tables and historical activity logs.

---

## 4. Restoring Backup & Schema Validation

1. In the **Settings → Data** tab, click **Select backup file to restore** or drag and drop your `.json` file into the upload zone.
2. **Pre-write Schema Validation**:
   - Tilo validates the uploaded JSON against strict Zod runtime schemas before writing.
   - Corrupt, invalid, or mismatched files are rejected with a clear error message, safeguarding your local database against corruption.
3. Upon successful validation, the data is committed inside a Dexie atomic transaction and the workspace reloads.

---

## 5. Reset & Demo Data

- **Load Deterministic Demo Data**: To explore analytics and rich calendar schedules without manual setup, click **Seed Demo Workspace** in Data settings.
- **Reset Workspace**: Cleanly re-initializes your local storage back to an empty default workspace.

---

## 6. Frequently Asked Questions

- **Q: Can I sync automatically across multiple devices?**  
  A: Tilo V1 does not have cloud synchronization. You can migrate data between machines by exporting a JSON backup on Machine A and importing it on Machine B.
- **Q: Does switching browsers preserve my data?**  
  A: IndexedDB storage is strictly sandboxed per browser (e.g. Chrome, Firefox, Safari). If you switch to another browser, you will need to export and restore your JSON backup.
