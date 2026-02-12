import api from "./axios";

export const updatePlacementStatus = (data) => {
  return api.post("/placement-status/set", data);
};
