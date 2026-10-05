# Simplified CollegeBook Admin Setup

The institution administrator no longer enters technical academic codes in the UI.

## Setup order

1. Create the academic year, e.g. **Class of 2026**.
2. Add faculties/schools by name. CollegeBook generates internal faculty codes.
3. Add departments by name and select their faculty/school. CollegeBook generates internal department codes.
4. Add students from the Student Registry.

## Student registry

The administrator enters only:

- Student name
- Matriculation number
- Phone number
- Department

The academic year/class is assigned automatically from the newest active institution-wide academic class. Students do not choose an academic year.

Internal database IDs and public codes remain in the database for integrity, URLs, logs and relationships; they are not required in the administrator's workflow.
