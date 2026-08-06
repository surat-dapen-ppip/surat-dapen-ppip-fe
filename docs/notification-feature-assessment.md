# Asesmen Fitur Notifikasi Surat

Dokumen ini memetakan route frontend, endpoint backend, dan fungsi service yang perlu diberi trigger notifikasi untuk lima kategori berikut:

1. Daftar surat yang membutuhkan **review**
2. Daftar surat yang membutuhkan **persetujuan**
3. Daftar surat yang **didisposisikan** ke user
4. Daftar surat yang di-**forward** ke user
5. Daftar surat yang **ditujukan** ke user (recipient)

## Konteks

- Sudah ada ikon lonceng notifikasi di `src/app/admin/layout.js` (baris 238-240, `MdNotifications`) tetapi masih statis/non-fungsional — tidak ada `onClick` maupun badge count. Ini adalah titik UI yang bisa langsung dipakai untuk fitur baru.
- Sudah ada pola *counter* real-time yang bisa dijadikan referensi:
  - `src/hooks/useLayoutContext.js` → fungsi `fetchCount` (badge global di sidebar: Inbox, History, Daftar Surat)
  - `src/app/admin/daftarSurat/page.js` → fungsi `fetchCountDaftar` (badge per-tab: Draft, Menunggu/Membutuhkan Review, Menunggu/Membutuhkan Persetujuan, Disetujui, Direvisi, Ditolak)
- Entity `Message` memiliki field kunci yang menjadi dasar penentuan penerima notifikasi: `DrafterUID`, `ReviewerUID`, `ApproverUID`, `RecipientUID`. Field-field ini di-set saat pembuatan surat (`POST /messages`), lihat `src/app/admin/suratKeluar/page.js` baris 200-224.
- Aksi disposisi, forward, submit, accept, dan reject pada surat masuk semuanya melewati satu endpoint generik `POST /events` dengan pembeda `EventID`, dikelola lewat `src/services/messageEvent.js`.

---

## 1. Surat yang membutuhkan review

| Aspek | Detail |
|---|---|
| Halaman FE | `/admin/daftarSurat` (tab "Membutuhkan Review") → detail di `/admin/review?uid=` |
| Endpoint list | `GET /messageMaster/forReviewer` (param `status=41`, `userUID`) |
| Endpoint count | `GET /messageMaster/countForReviewer` (param `status=41`, `userUID`) |
| Service FE | `getMessagesForReviewer`, `countMessagesForReviewer` — `src/services/message.js:96-108,138-150` |
| Dipakai di | `daftarSurat/page.js:129,156`; `useLayoutContext.js:26` (badge global) |
| Aksi penyelesai | `review/page.js` → `handleApprove` / `handleRevision` / `handleReject`, memanggil `approveMessage` (`POST /messages/approve/:uid`), `rejectMessage` (`POST /messages/reject/:uid`), atau `createMessageRevision` (`POST /messageRevision`) |

**Trigger backend yang disarankan:**
- Saat `POST /messages` dibuat dan surat masuk stage review (`status=41`) dengan `ReviewerUID` terisi → kirim notifikasi ke `ReviewerUID`.
- Notifikasi selesai/di-clear saat `POST /messages/approve/:uid`, `POST /messages/reject/:uid`, atau `POST /messageRevision` dieksekusi oleh reviewer tersebut.

---

## 2. Surat yang membutuhkan persetujuan

| Aspek | Detail |
|---|---|
| Halaman FE | `/admin/daftarSurat` (tab "Membutuhkan Persetujuan") → detail di `/admin/approve?uid=` |
| Endpoint list | `GET /messageMaster/forApprover` (param `status=42`, `userUID`) |
| Endpoint count | `GET /messageMaster/countForApprover` (param `status=42`, `userUID`) |
| Service FE | `getMessagesForApprover`, `countMessagesForApprover` — `src/services/message.js:67-93` |
| Dipakai di | `daftarSurat/page.js:131,162`; `useLayoutContext.js:27` (badge global) |
| Aksi penyelesai | `approveMessage` (`POST /messages/approve/:uid`) / `rejectMessage` (`POST /messages/reject/:uid`) |

**Trigger backend yang disarankan:**
- Saat status surat naik ke stage approval (`status=42`), biasanya setelah reviewer approve, dan `ApproverUID` terisi → kirim notifikasi ke `ApproverUID`.
- Notifikasi selesai saat `POST /messages/approve/:uid` atau `POST /messages/reject/:uid` dipanggil oleh approver tersebut.

---

## 3. Surat yang didisposisikan ke user

| Aspek | Detail |
|---|---|
| Halaman FE | `/admin/inbox/detail-surat-masuk?uid=` dan `/admin/history/detail-surat-masuk?uid=` (modal "Disposisi") |
| Endpoint | `POST /events` dengan body `EventID=1` |
| Service FE | `createMessageEvent` — `src/services/messageEvent.js:26-33` |
| Payload kunci | `ListUserUID` (comma-separated daftar penerima disposisi), `ListUserName`, `MessageUID`, `FromUserUID`, `FromUserName` |
| Dipakai di | `handleMessageEvent()` — `detail-surat-masuk/page.js:327-371`. Nilai `EventID=1` diterjemahkan sebagai "disposisi" oleh `GetEventIDName` (`src/utils/utility.js:14-31`) |
| Efek samping | Setelah event dibuat, dipanggil juga `PUT /messages/:uid/processed` (`updateMessageProccessed`) |

**Trigger backend yang disarankan:**
- Pada `POST /events` dengan `EventID=1`, parse `ListUserUID` (bisa lebih dari satu user) → kirim notifikasi ke tiap user pada daftar tersebut.

---

## 4. Surat yang di-forward ke user

| Aspek | Detail |
|---|---|
| Halaman FE | Sama seperti kategori 3, modal "Forward" pada halaman detail surat masuk |
| Endpoint | `POST /events` dengan body `EventID=2` |
| Service FE | `createMessageEvent` — `src/services/messageEvent.js:26-33` |
| Payload kunci | `ListUserUID`, `ListUserName`, `MessageUID`, `FromUserUID` |
| Label internal | `EventID=2` → "dialihkan" (`GetEventIDName`, `src/utils/utility.js:14-31`) |

**Trigger backend yang disarankan:**
- Pola sama dengan disposisi: pada `POST /events` dengan `EventID=2`, kirim notifikasi ke tiap UID di `ListUserUID`.

> **Catatan tambahan:** endpoint `POST /events` juga menangani EventID lain yang relevan untuk lifecycle notifikasi meskipun tidak diminta eksplisit di lima kategori awal:
> - `EventID=3` — disubmit (disertai `SubmitID`: 1 = tanpa surat, 2 = dengan surat)
> - `EventID=4` — diterima/acc di level inbox
> - `EventID=5` — ditolak di level inbox
>
> Sebaiknya dipertimbangkan agar drafter/pengirim juga mendapat notifikasi balik saat surat mereka diterima/ditolak di level inbox.

---

## 5. Surat yang ditujukan ke user (recipient)

| Aspek | Detail |
|---|---|
| Halaman FE | `/admin/inbox` |
| Endpoint list | `GET /messages` (param `userUID`) |
| Endpoint count (badge sidebar) | `GET /report/countInbox` (param `recipientUID`, `messageClassification`) |
| Service FE | `getMessages` — `src/services/message.js:4-20`; `getCountInbox` — `src/services/message.js:284-296` |
| Dipakai di | `inbox/page.js:71` (list); `useLayoutContext.js:21` (badge global `countInbox`) |

**Trigger backend yang disarankan:**
- Saat `POST /messages` dibuat dengan `RecipientUID` berisi satu atau lebih UID (comma-separated, lihat `src/app/admin/suratKeluar/page.js:207-210`) → kirim notifikasi ke tiap UID pada `RecipientUID`.

---

## Ringkasan endpoint yang perlu instrumentasi trigger

| Endpoint | Method | Kategori terkait | Catatan |
|---|---|---|---|
| `/messages` | POST | (5) recipient, awal (1)/(2) | Set awal `RecipientUID`, `ReviewerUID`, `ApproverUID` |
| `/messages/approve/:uid` | POST | (1) / (2) | Approval/lanjut stage — clear notif approver/reviewer, notif balik ke drafter |
| `/messages/reject/:uid` | POST | (1) / (2) | Rejection — clear notif, notif ke drafter |
| `/messageRevision` | POST | (1) | Revisi diminta reviewer — notif ke drafter |
| `/events` (`EventID=1`) | POST | (3) disposisi | Notif ke setiap UID di `ListUserUID` |
| `/events` (`EventID=2`) | POST | (4) forward | Notif ke setiap UID di `ListUserUID` |
| `/messages/:uid/processed` | PUT | semua | Penanda "sudah diproses" — kandidat untuk auto-dismiss notifikasi terkait |

Seluruh endpoint di atas sudah aktif digunakan FE (bukan endpoint mati), sehingga backend dapat menambahkan trigger notifikasi langsung di masing-masing handler tanpa perlu perubahan kontrak API ke FE — field `RecipientUID`, `ReviewerUID`, `ApproverUID`, dan `ListUserUID` sudah tersedia di payload yang dikirim FE saat ini.
