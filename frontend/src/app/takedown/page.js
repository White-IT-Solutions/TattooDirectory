"use client";

import { useState } from "react";
import { api } from "../lib/api";

export default function TakedownPage() {
  const [formData, setFormData] = useState({
    email: "",
    instagram: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.submitRemovalRequest({
        instagramHandle: formData.instagram,
        reason: formData.message,
      });
      
      setFormData({ email: "", instagram: "", message: "" });
      alert("Your takedown request has been submitted!");
    } catch (error) {
      console.error('Failed to submit request:', error);
      alert("Failed to submit request. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-xl bg-white shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Takedown Request
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
            />
          </div>

          {/* Instagram Username */}
          <div>
            <label
              htmlFor="instagram"
              className="block text-sm font-medium text-gray-700"
            >
              Instagram Username
            </label>
            <input
              type="text"
              name="instagram"
              id="instagram"
              value={formData.instagram}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
            />
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700"
            >
              Message
            </label>
            <textarea
              name="message"
              id="message"
              rows="5"
              value={formData.message}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
            ></textarea>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}
