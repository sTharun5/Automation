/**
 * Validate internship proof file name
 * Format: ROLLNO-ITI/ITO-DD.MM.YYYY.pdf
 */
exports.validateInternshipFile = (fileName, studentRollNo) => {
  const regex =
    /^([A-Z0-9]+)-(ITI|ITO)-(\d{2}\.\d{2}\.\d{4})\.pdf$/;

  const match = fileName.match(regex);

  if (!match) {
    throw new Error(
      "Invalid file format. Expected ROLLNO-ITI/ITO-DD.MM.YYYY.pdf"
    );
  }

  const rollNo = match[1];

  if (rollNo !== studentRollNo) {
    throw new Error("Roll number in file does not match student");
  }

  return true;
};
