import api from "./axios";

export const getAllStudents = () => {
  return api.get("/students/list");
};
