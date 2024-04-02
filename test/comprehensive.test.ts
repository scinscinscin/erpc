// sum.test.js
import { expect, test } from "vitest";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:2000";

test("the server is alive", async () => {
  let isSuccess = false;
  try {
    const { data } = await axios.post("/login", { username: "string", password: "string" });
    if (data.success) isSuccess = true;
  } catch {}

  expect(isSuccess).toBe(true);
});

test("a subrouter was created successfully", async () => {
  const { data } = await axios.get("/users");
  expect(Array.isArray(data.result.users)).toBe(true);
});

test("req.params contains the path parameters", async () => {
  const { data } = await axios.put("/users/testing_uuid", { new_password: "" });
  expect(data.result.updatedUser.uuid).toBe("testing_uuid");
});

test("throws a validation error", async () => {
  let data = {} as any;
  try {
    await axios.put("/users/testing_uuid", {});
  } catch (err) {
    data = err.response.data;
  }

  expect(data.success).toBe(false);
  expect(data.error.type).toBe("BAD_REQUEST");
});

test("throws a not found error", async () => {
  let success = true;
  try {
    await axios.put("/non_existent_route", {});
  } catch (err) {
    success = false;
  }

  expect(success).toBe(false);
});
