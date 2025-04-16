"use client";
import { useState, useEffect } from "react";
// Assuming a service to fetch users exists
import { fetchAllClients } from "@/services/userService"; // Adjust this import based on your setup

const UsersListPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userData = await fetchAllClients(); // Fetch all users
        setUsers(userData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-20 lg:py-28">
        <div className="container text-center">
          <p>Loading users...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-black dark:text-white">
            Users List
          </h2>
          <p className="text-base text-body-color mt-3 max-w-xl mx-auto">
            Manage all registered users here.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Username</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black dark:text-white">Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{user.id || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{user.username || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{user.email || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default UsersListPage;