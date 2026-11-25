/**
 * app/(admin)/users.tsx
 *
 * User Management screen for platform administrators.
 * Displays member accounts, role promotion, status toggles, and deletion via API.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import {
  fetchAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  deleteAdminUser,
} from '@/services/api';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import type { User } from '@/types';

export default function AdminUsersScreen() {
  const router = useRouter();
  const { siteId } = useSelectedSite();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const effectiveSiteId = siteId || 'website1';

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminUsers(effectiveSiteId);
      const list = Array.isArray(res?.data) ? res.data : [];
      setUsers(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load user accounts';
      Alert.alert('Load Error', msg);
    } finally {
      setLoading(false);
    }
  }, [effectiveSiteId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const handleRoleToggle = (user: User) => {
    const isCurrentlyAdmin = (user.role || '').toLowerCase() === 'admin' || (user.role || '').toLowerCase() === 'superadmin';
    const nextRole = isCurrentlyAdmin ? 'user' : 'Admin';
    Alert.alert(
      'Change Role',
      `Change role for "${user.name}" (${user.email}) to "${nextRole === 'Admin' ? 'Administrator' : 'Customer'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateAdminUserRole(user.id, nextRole, effectiveSiteId);
              setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, role: nextRole as any } : u))
              );
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed to update user role';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const handleStatusToggle = (user: User) => {
    const isCurrentlyDisabled = user.isDisabled || user.status === 'disabled';
    const nextDisabled = !isCurrentlyDisabled;
    const action = nextDisabled ? 'deactivate' : 'activate';

    Alert.alert(
      'Account Status',
      `Are you sure you want to ${action} account for "${user.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateAdminUserStatus(user.id, nextDisabled, effectiveSiteId);
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === user.id
                    ? {
                        ...u,
                        isDisabled: nextDisabled,
                        status: nextDisabled ? 'disabled' : 'active',
                      }
                    : u
                )
              );
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed to update account status';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (user: User) => {
    Alert.alert(
      'Confirm Deletion',
      `Permanently delete user "${user.name}" (${user.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdminUser(user.id, effectiveSiteId);
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed to delete user';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      {/* Search Header */}
      <View style={styles.searchBar}>
        <TouchableOpacity
          testID="btn-users-back-overview"
          accessibilityLabel="Back to Admin Overview"
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(admin)'))}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color="#0284c7" />
          <Text style={styles.backBtnText}>Overview</Text>
        </TouchableOpacity>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or role..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading accounts...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isAdmin = (item.role || '').toLowerCase() === 'admin' || (item.role || '').toLowerCase() === 'superadmin';
            const isDisabled = item.isDisabled || item.status === 'disabled';

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: isAdmin ? '#2563eb' : '#64748b' },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {(item.name?.[0] || item.email[0]).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name || 'Member'}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                </View>

                <View style={styles.badgesRow}>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: isAdmin ? '#f3e8ff' : '#f1f5f9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        { color: isAdmin ? '#7c3aed' : '#475569' },
                      ]}
                    >
                      {item.role || 'User'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: isDisabled ? '#fee2e2' : '#d1fae5' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        { color: isDisabled ? '#991b1b' : '#065f46' },
                      ]}
                    >
                      {isDisabled ? 'Disabled' : 'Active'}
                    </Text>
                  </View>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity testID="btn-users-231" accessibilityLabel="users action"
                    style={styles.actionBtn}
                    onPress={() => handleRoleToggle(item)}
                  >
                    <Text style={styles.actionBtnText}>
                      {isAdmin ? 'Make User' : 'Make Admin'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity testID="btn-users-240" accessibilityLabel="users action"
                    style={[styles.actionBtn, isDisabled ? styles.activateBtn : styles.disableBtn]}
                    onPress={() => handleStatusToggle(item)}
                  >
                    <Text
                      style={[
                        styles.actionBtnText,
                        { color: isDisabled ? '#065f46' : '#b45309' },
                      ]}
                    >
                      {isDisabled ? 'Activate' : 'Disable'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity testID="btn-delete" accessibilityLabel="Delete"
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item)}
                  >
                    <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 6,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 11,
    color: '#64748b',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: SPACING.xs + 2,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    backgroundColor: '#f1f5f9',
  },
  disableBtn: {
    backgroundColor: '#fef3c7',
  },
  activateBtn: {
    backgroundColor: '#d1fae5',
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  centerContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
});
