# שי מערכות חכמות — Project Context

## מה זה
אתר לידים + PDF one-pager לחברת "שי מערכות חכמות" — בית חכם, אבטחה ואוטומציה לבתים ועסקים בישראל.

## קבצים מרכזיים
- `index.html` — האתר הראשי
- `style.css` — עיצוב (CSS custom properties)
- `script.js` — לוגיקה (תרגום, אנימציות, טפסים)
- `onepager.html` — PDF דו-עמודי (עברית + אנגלית)
- `accessibility.html` — הצהרת נגישות
- `netlify.toml` — הגדרות Netlify (redirects, headers, UTM links)
- `images/` — כל התמונות + לוגו SVG
- `fonts/` — Heebo + Inter TTF (לPDF בלבד)

## לוגו
- `images/logo.svg` — כהה (לנאבבר על רקע בהיר)
- `images/logo-light.svg` — בהיר/קרם (לfooter ולPDF על רקע כהה)
- viewBox: `"175 45 255 130"` (חתוך מ-600x200 המקורי)

## מערכת עיצוב
- פלטה: cream `#F8F5F0`, charcoal `#1C1C1C`, gold `#B8965A`
- CSS custom properties ב-`:root`
- RTL ברירת מחדל (Hebrew), LTR לאנגלית

## דו-לשוניות (עברית/אנגלית)
```html
<span data-he="טקסט עברי" data-en="English text">טקסט עברי</span>
```
JS: `_translateAll()` — משתמש ב-`textContent` (לא innerHTML) אלא אם הערך מכיל `<br` או `&`.
**חשוב:** suffix של stats (+ או %) חייב להיות ב-span נפרד שלא מתורגם, אחרת `_translateAll` מוחק אותו.

## פרטי קשר
- טלפון: 054-9019815
- אימייל: shaisystems5@gmail.com
- אתר: shai-systems.com
- Formspree form ID: `mbdepngj`

## Netlify
- פרויקט: `fastidious-peony-fc4049`
- Site ID: `aa3e14a2-026e-4089-aa2a-6f4fb2105e8e`
- דומיין: shai-systems.com (GoDaddy nameservers → Netlify)
- **תמיד deploy עם:** `netlify deploy --prod --dir . --site aa3e14a2-026e-4089-aa2a-6f4fb2105e8e`
- יש 3 פרויקטים בחשבון — לא לבלבל!

## GitHub
- ריפו: https://github.com/jc4iot/shai-systems
- חשבון GitHub: `jc4iot`

## PDF generation
```powershell
# חייב שserver יהיה פעיל קודם (npx serve -l 3456)
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --print-to-pdf="OUTPUT.pdf" --print-to-pdf-no-header --no-margins "http://localhost:3456/onepager.html"
```
- גופנים מקומיים בלבד (Google CDN לא עובד ב-headless)
- לעצור את server לפני עריכת style.css דרך PowerShell

## כללי עבודה חשובים
- **לא לעשות deploy לפני שהמשתמש ראה ואישר את השינויים**
- עבודה מקומית קודם, deploy רק עם אישור מפורש
- Preview server: `npx serve -l 3456`

## ⚠️ CSS/JS cache — הכלל הכי חשוב בפרויקט
`netlify.toml` מגיש `style.css` ו-`script.js` עם `max-age=31536000, immutable`,
וה-HTML עם `max-age=0`. **אל תשנה את ה-headers.** במקום זה:

**כל שינוי ב-`style.css` או ב-`script.js` מחייב העלאת מספר הגרסה ב-3 המקומות:**
- `index.html` — `<link href="style.css?v=...">` ו-`<script src="script.js?v=...">`
- `accessibility.html` — `<link href="style.css?v=...">`

הטוקן הנוכחי: `20261106c`. הוא סתם מזהה — צריך רק **להשתנות**, לא להיות תאריך מדויק.

**למה זה קריטי:** `immutable` אומר שהדפדפן לא בודק אם יש גרסה חדשה. בלי העלאת הגרסה,
מבקר חוזר מקבל HTML חדש עם CSS בן שנה — צירוף שלא נבדק ושובר את הפריסה.
ב-17.7.2026 זה שבר את המובייל ובזבז שעות של דיבוג.

## שירותים באתר (6 כרטיסים)
1. מצלמות אבטחה
2. אזעקות ומערכות גילוי
3. בית חכם וחשמל חכם
4. תקשורת ורשת
5. אינטרקום ובקרת כניסה
6. מערכות אודיו ← נוסף ביולי 2026

## UTM tracking links (ב-netlify.toml)
`/wa-private`, `/wa-pro`, `/mail-private`, `/mail-pro`, `/ig-private`, `/ig-pro`, `/fb-private`, `/fb-pro`
