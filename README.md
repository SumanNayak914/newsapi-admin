# NewsHub Admin Panel

News manage karne ka admin dashboard — articles add/edit karo, users dekho, API keys manage karo.

---

## Login kaise karein

1. Browser mein admin URL kholo
2. Email + Password daalo (owner account)
3. Dashboard dikhega

---

## Articles Add karna

1. Left sidebar mein **"Articles"** pe click karo
2. **"+ Add Article"** button dabao
3. Form bharo:

| Field | Zaroori? | Kya daalna hai |
|-------|----------|----------------|
| **Cover Image** | Optional | News ki photo upload karo (max 2MB) |
| **Title** | Zaroori | News ka headline |
| **Short Description** `API Preview` | Important | 1-2 line ka summary — **yahi API users ko milta hai** |
| **Category** | Zaroori | Technology / Business / Sports / Health / Entertainment / General |
| **Author** | Optional | Likhne wale ka naam |
| **Mark as Trending** | Optional | Check karo agar yeh top news hai |
| **Active (Published)** | — | Check = website pe dikhega, Uncheck = hidden |
| **Full Content** | Optional | Poora article yahan likhо (rich text editor) |

4. **"Publish Article"** dabao

> **Short Description ke baare mein:** API users sirf yahi description dekhenge.
> Full article padhne ke liye unhe aapki website pe aana padega (`article_url` ke through).

---

## Articles Edit karna

Articles list mein kisi bhi article ke saamne **pencil icon** dabao → Edit modal khulega.

---

## Article Delete (Inactive) karna

**Trash icon** dabao → "Mark Inactive" → Article website se hat jaayega (permanently delete nahi hota).

---

## Bulk Actions

Checkbox se multiple articles select karo → **"Publish All"** ya **"Unpublish All"**

---

## CSV Bulk Import

Ek saath kai articles upload karne ke liye:

1. **"Template"** button se sample CSV download karo
2. Excel/Google Sheets mein articles bharo
3. **"Bulk CSV"** button se upload karo

CSV columns:
```
Title, Description, Category, Content, ImageUrl, Author, IsTrending
```

---

## API Keys Manage karna

1. Sidebar mein **"API Keys"** pe click karo
2. User ki key dekh sakte ho — status, usage, rate limit
3. Key suspend/activate kar sakte ho

---

## Users Manage karna

Sidebar mein **"Users"** — saare registered users, unka plan, total requests.

---

## Analytics

Sidebar mein **"Analytics"** — daily requests, popular articles, top categories.

---

## Local Development

```bash
cd newapiadmin
npm install
npm run dev
```

Browser mein kholo: `http://localhost:5173`
