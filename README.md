## Better Eats

Better Eats is a Tampermonkey script that improves Uber Eats web experience.

![Screenshot 2024-08-16 at 7 10 06 PM](https://github.com/user-attachments/assets/fb4193d1-1f82-4fe2-9eb6-aae6514fa74d)

### Installation:
1. Install [Tampermonkey](https://tampermonkey.net/)
2. Navigate to [this file](https://github.com/pxue/better-eats/blob/main/script.user.js), click the "Raw" bottom at top right corner.
3. It should automatically open Tampermonkey for installation.
4. ** Must be used on the "Offers" pre-filtered page  **

### Features:

- Works both in Canada (`/ca/feed`) and the US (`/feed`)
- Show only Buy 1, Get 1 free deals
- Filter by exact rating (ie. 4.5+)
- Black list (ie. hide all McDonald's)

### UI improvements:

- Updated grid to have 5 items per row

... more features coming soon ...

### Exclusion list

Value of the exclusion list is stored in local storage as a JSON array. You can
manually update via the UI or directly in the storage.


### How to develop

You can directly edit the extension via tampermonkey dashboard or load
`script.user.js` file

To load the the script file, create a new script with only the following header

```
// ==UserScript==
// @name         Better Eats
// @namespace    https://ubereats.com/
// @grant        none
// @require      file://<path to script.user.js>
// ==/UserScript==
```

From there, enable local file url access via https://www.tampermonkey.net/faq.php?locale=en#Q204
