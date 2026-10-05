# Simplified CollegeBook Admin Setup

The admin API now generates internal faculty and department codes automatically. Academic classes are institution-wide and are created from the academic year.

When an institution administrator adds a student, the backend automatically assigns the newest active institution-wide academic class. The client does not send an academic-set ID.

If no active academic class exists, student creation is rejected with an instruction to create the academic year first.

Database IDs and generated public codes remain intact; this is a UI/workflow simplification, not removal of relational integrity.
