## Better Eats

Better Eats is a Tampermonkey script that improves Uber Eats web experience.

<img width="1792" alt="Screenshot 2023-08-23 at 12 53 14 PM" src="https://github.com/pxue/better-eats/assets/270494/1344fd0e-3575-48ce-9b43-eec0cf0a8da7">


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
