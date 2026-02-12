import api from "./api";

export const getOdById = (odId) => {
  return api.get(`/od/${odId}`);
};
