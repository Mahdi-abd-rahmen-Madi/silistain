import { useState, useEffect } from 'react';
import { getAdminClient } from '../../lib/supabaseClient';

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  is_admin?: boolean;
  is_active?: boolean;
}

export const UsersTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string>('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }

      // First, get all auth users
      const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Get user metadata from the users table
      const { data: dbUsers, error: dbError } = await adminClient
        .from('users')
        .select('*');
      
      if (dbError) throw dbError;

      // Combine auth data with user data from the database
      const combinedUsers = authUsers.map(authUser => {
        const dbUser = dbUsers.find(u => u.id === authUser.id) || {};
        return {
          id: authUser.id,
          email: authUser.email || 'No email',
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          is_admin: dbUser.is_admin || false,
          is_active: authUser.user_metadata?.is_active ?? true
        };
      });

      setUsers(combinedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }

      // First, check if the user has any orders
      const { data: userOrders, error: ordersError } = await adminClient
        .from('orders')
        .select('id')
        .eq('user_id', userId);
        
      if (ordersError) throw ordersError;
      
      if (userOrders && userOrders.length > 0) {
        throw new Error('Cannot delete user with existing orders. Please deactivate the user instead.');
      }

      // Delete user from auth
      const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Delete user from users table
      const { error: dbError } = await adminClient
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (dbError) throw dbError;

      // Update local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));

      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(`Failed to delete user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'remove admin' : 'make admin'} this user?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }

      // Update the is_admin status in the users table
      const { error } = await adminClient
        .from('users')
        .update({ 
          is_admin: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Also update the user's auth metadata if needed
      const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { is_admin: !currentStatus }
      });
      
      if (authError) throw authError;

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                is_admin: !currentStatus,
                updated_at: new Date().toISOString()
              } 
            : user
        )
      );

      setSuccess(`User ${currentStatus ? 'removed from' : 'added to'} admin successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(`Failed to update user role: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }

      // Update the user's active status in auth
      const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { is_active: !currentStatus }
      });

      if (authError) throw authError;

      // Also update the users table for consistency
      const { error: dbError } = await adminClient
        .from('users')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (dbError) throw dbError;

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                is_active: !currentStatus,
                updated_at: new Date().toISOString()
              } 
            : user
        )
      );

      setSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating user status:', err);
      setError(`Failed to update user status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Login
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.email}</div>
                  <div className="text-xs text-gray-500">{user.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.last_sign_in_at || '')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => toggleAdminStatus(user.id, user.is_admin || false)}
                    className={`text-xs px-3 py-1 rounded ${
                      user.is_admin 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button
                    onClick={() => toggleUserStatus(user.id, user.is_active !== false)}
                    className={`text-xs px-3 py-1 rounded ${
                      user.is_active !== false 
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.is_active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTab;
