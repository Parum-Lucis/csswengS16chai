# Import/Export Manual

This guide explains how to import and export data in the **CHAI Management and Events Tracker** app for both clients and developers. This functionality allows the import or export of current data on beneficiaries, volunteers, and events in batches. All import processes require admin privileges, however regular volunteers may access the beneficiary and event export functions.

---

## File Format

- All import and export functionalities only use **Comma Separated Values (.csv)** files. For convenience, you may use either Google Sheets or Microsoft Excel to prepare your data into the required format (to be discussed later). In the case you do so, please don't forget to  **save or download your data as a .csv file**. 
- Please take note that the the very first row within your .csv file will be ignored, assuming that it is the header row (row for column names). A header row will ensure that users are guided on how to properly format their data.
- When importing, there must be least one valid row of data (apart from the header row) present within your file.
- Max file size limit 10 MB.

### General Data Format
Ensure that you follow the format of data below:
- `mm/dd/yyyy` for dates (eg., `1/20/2010` for January 20, 2010) 
- `hh:mm (24-hour format)` for time (eg., `23:00` for 10:00PM)
- `09XXXXXXXXX` for contact numbers (eg., `09167646283`)
- email addresses should also be valid (eg., `chai.taguig@gmail.com`)

---

## Beneficiaries

### Exporting Beneficiaries (Admin)
This function can be found in the **admin page** under the Beneficiary section, which means this requires that the account has admin privileges.

**Order of Data (Headers, left to right):**
1. Child Number (ID) - blank or number
2. First Name - required
3. Last Name - required
4. Sex - M or F
5. Birthdate - mm/dd/yyyy
6. Grade Level - Nursery, Kindergarten, or numbers 1 to 12
7. Address
8. Name (Guardian 1)
9. Relation (Guardian 1)
10. Contact Number (Guardian 1)
11. Email (Guardian 1)
12. Name (Guardian 2)
13. Relation (Guardian 2)
14. Contact Number (Guardian 2)
15. Email (Guardian 3)
16. Name (Guardian 3)
17. Relation (Guardian 3)
18. Contact Number (Guardian 3)
19. Email (Guardian 3)

**Required Fields:** `First Name`, `Last Name`
**Optional Fields:** All others can be left blank
- If `Birthdate` is blank, the placeholder `1/1/1900` will be given to the beneficiary
- If `Child Number (ID)` already exists, the beneficiary will not be added
- If no guardian is provided → one empty guardian slot is saved for later

**Guardian Fields:** requires `Guardian Name`, `Relation`, and `Contact Number`
- If `Contact Number` is invalid, guardian will be skipped
- If `Email` is invalid, it will be blank for later

Note that if any other fields are not blank but do not follow the required format (`sex, birthdate, grade level, contact numbers, and emails`), the beneficiary will not be added to the system.

NOTES
- i made it accept no contact/email guardians for now, kasi why allow 0 guardians if this we dont allow?


**Sample Data**

| Child Number (ID) | First Name | Last Name | Sex | Birthdate  | Grade Level | Address             | Name (Guardian 1) | Relation (Guardian 1) | Contact Number (Guardian 1) | Email (Guardian 1)                            | Name (Guardian 2) | Relation (Guardian 2) | Contact Number (Guardian 2) | Email (Guardian 2)                          | Name (Guardian 3) | Relation (Guardian 3) | Contact Number (Guardian 3) | Email (Guardian 3)                          |
| ----------------- | ---------- | --------- | --- | ---------- | ----------- | ------------------- | ----------------- | --------------------- | --------------------------- | --------------------------------------------- | ----------------- | --------------------- | --------------------------- | ------------------------------------------- | ----------------- | --------------------- | --------------------------- | ------------------------------------------- |
| 10001             | Ana        | Cruz      | F   | 03/12/2014 | 5           | Manila        | Marjorie        | Mother                | 09171234567                 | marjorie@gmail.com                     |                  |                      |                            |                                            |
|                   | Jomar      | Reyes     | M   |            | 3           | Brgy. San Roque     | Luis Reyes        | Father                | 09998887777                 | luis@gmail.com   | Anna Reyes        | Mother                | 09171230000                 | anna@gmail.com |                  |                      |                            |                                            |
| 10002             | Bea        | Santos    | F   | 11/20/2013 | 6     | Brgy. Bagong Silang | Carla Santos      | Aunt                  | 09181234567                 | carla@gmail.com | Jose Santos       | Uncle                 | 09221234567                 | jose@gmail.com | Maria Santos      | Grandmother           | 09181231234                 | lola@gmail.com |




### Exporting Beneficiaries
This function can be found within the **beneficiary list** page by tapping on the **More button (⋮) > Export**. This will export all current beneficiary data into a .csv file, with the same format as previously mentioned.
- will not export if there are no beneficiaries within the system.
- will not export deleted beneficiaries

---

## Volunteers

### Importing Volunteers (Admin)
This function can be found in the **admin page** under the Beneficiary section, which means this requires that the account has admin privileges. This will automatically create an account for each volunteer with the given email address and admin boolean.

**Order of Data (Headers, left to right):**
1. Email - required
2. First Name - required
3. Last Name - required
4. Sex - M or F
5. Birthdate - mm/dd/yyyy
6. Address
7. Admin - TRUE or FALSE

**Required Fields:** `Email`, `First Name`, `Last Name`
**Optional Fields:** All others can be left blank
- `Admin` column must be `TRUE` or `FALSE`; if blank/invalid → treated as `FALSE`
- If `Birthdate` is blank, the placeholder `1/1/1900` will be given to the volunteer
- If `Email` already exists, the volunteer will not be added

Note that if any other fields are not blank but do not follow the required format (`sex, birthdate`), the volunteer will not be added to the system.

**Sample Data**
| Email                                                 | First Name | Last Name | Sex | Birthdate  | Contact Number | Address          | Admin |
| ----------------------------------------------------- | ---------- | --------- | --- | ---------- | -------------- | ---------------- | ----- |
| janna@gmail.com    | Janna       | Mendoza       | F   | 02/14/1995 | 09171234567    | Brgy. Maligaya   | TRUE  |
| juandelacruz@gmail.com | Juan       | Dela Cruz | M   | 08/05/1990 | 09998887777    | Brgy. Bagumbayan | FALSE |
| testuser@gmail.com      | Test       | User      | F   |            |                | Brgy. Santo Niño |       |


### Exporting Volunteers (Admin)
This function can be found within the **volunteer list** page (under Volunteer section in admin page) by tapping on the **More button (⋮) > Export**. This will export all current volunteer data into a .csv file, with the same format as previously mentioned.
- will not export if there are no volunteers within the system.
- will not export deleted volunteers

---

## Events

### Importing Events (Admin)
This function can be found in the **admin page** under the Events section, which means this requires that the account has admin privileges. 

**Order of Data (Headers, left to right):**
1. Name (of event) - required
2. Description
3. Date - mm/dd/yyyy, required
4. Start Time - hh:mm, required
5. End Time - hh:mm, required
6. Location

- **Required Fields:** `Name`, `Date`, `Start Time`, `End Time`
- If event with same `Name, Date and Time (both start and end)` already exists, event will not be added

Note that if any other fields are not blank but do not follow the required format (`date, start time, end time`), the event will not be added to the system.


### Exporting Events
This function can be found within the **events list** page by tapping on the **More button (⋮) > Export**. This will export all current event data (except attendee-related information) into a .csv file, with the same format as previously mentioned.
- will not export if there are no events within the system.
- will not export deleted events

---
