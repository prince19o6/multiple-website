/**
 * app/(admin)/tours.tsx
 *
 * Tour Catalog Management screen for administrators.
 * Supports viewing tours, deleting tours, editing, duplicating, and creating new tours via modal.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import {
  fetchTours,
  createTour,
  updateTour,
  deleteTour,
} from '@/lib/api';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { PLACEHOLDER_IMAGE } from '@/lib/imageUtils';
import type { Tour } from '@/types';

export default function AdminToursScreen() {
  const { siteId } = useSelectedSite();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Editing state
  const [editingTour, setEditingTour] = useState<Tour | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Beach');
  const [destination, setDestination] = useState('');
  const [price, setPrice] = useState('499');
  const [duration, setDuration] = useState('4 Days / 3 Nights');
  const [difficulty, setDifficulty] = useState('Easy');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(PLACEHOLDER_IMAGE);
  const [featured, setFeatured] = useState(false);
  const [popular, setPopular] = useState(false);

  const effectiveSiteId = siteId || 'website1';

  const loadTours = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTours(effectiveSiteId);
      const list = Array.isArray(res?.data) ? res.data : [];
      setTours(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load tours';
      Alert.alert('Load Error', msg);
    } finally {
      setLoading(false);
    }
  }, [effectiveSiteId]);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  const filteredTours = useMemo(() => {
    return tours.filter(
      (t) =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.toLowerCase().includes(search.toLowerCase()) ||
        t.destination?.toLowerCase().includes(search.toLowerCase())
    );
  }, [tours, search]);

  const openCreateModal = () => {
    setEditingTour(null);
    setName('');
    setCategory('Beach');
    setDestination('Goa');
    setPrice('499');
    setDuration('4 Days / 3 Nights');
    setDifficulty('Easy');
    setDescription('Scenic beach landscapes, relaxation, and cultural activities.');
    setImage(PLACEHOLDER_IMAGE);
    setFeatured(false);
    setPopular(false);
    setModalVisible(true);
  };

  const openEditModal = (tour: Tour) => {
    setEditingTour(tour);
    setName(tour.name);
    setCategory(tour.category || 'Beach');
    setDestination(tour.destination || tour.location || '');
    setPrice(String(tour.price || 499));
    setDuration(tour.duration || '3 Days');
    setDifficulty(tour.difficulty || 'Moderate');
    setDescription(tour.description || '');
    setImage(tour.image || PLACEHOLDER_IMAGE);
    setFeatured(!!tour.featured);
    setPopular(!!tour.popular);
    setModalVisible(true);
  };

  const handleDelete = (tourId: string | number, tourName: string) => {
    Alert.alert('Confirm Deletion', `Permanently delete tour "${tourName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTour(tourId, effectiveSiteId);
            setTours((prev) => prev.filter((t) => t.id !== tourId));
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to delete tour';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  const handleDuplicate = async (tour: Tour) => {
    Alert.alert('Duplicate Tour', `Create a copy of "${tour.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Duplicate',
        onPress: async () => {
          try {
            const cloned: Partial<Tour> = {
              name: `${tour.name} (Copy)`,
              slug: `${tour.slug || 'tour'}-copy-${Date.now()}`,
              category: tour.category,
              destination: tour.destination,
              location: tour.location,
              price: tour.price,
              duration: tour.duration,
              difficulty: tour.difficulty,
              description: tour.description,
              image: tour.image,
              rating: 5.0,
              reviews: 0,
            };
            const created = await createTour(cloned, effectiveSiteId);
            setTours((prev) => [created, ...prev]);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to duplicate tour';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert('Required', 'Please enter a tour title and description.');
      return;
    }

    setSaving(true);
    const payload: Partial<Tour> = {
      name: name.trim(),
      category: category.trim(),
      destination: destination.trim(),
      location: destination.trim(),
      price: Number(price) || 499,
      duration: duration.trim(),
      difficulty: difficulty.trim(),
      description: description.trim(),
      image: image.trim() || PLACEHOLDER_IMAGE,
      featured,
      popular,
      rating: 5.0,
      reviews: 0,
    };

    try {
      if (editingTour) {
        const updated = await updateTour(editingTour.id, payload, effectiveSiteId);
        setTours((prev) => prev.map((t) => (t.id === editingTour.id ? updated : t)));
      } else {
        const created = await createTour(payload, effectiveSiteId);
        setTours((prev) => [created, ...prev]);
      }
      setModalVisible(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save tour';
      Alert.alert('Save Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Search & Actions Header */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tours..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity testID="btn-add" accessibilityLabel="add" style={styles.addBtn} onPress={openCreateModal} activeOpacity={0.88}>
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>New Tour</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading catalog...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTours}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.image || PLACEHOLDER_IMAGE }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardPrice}>${item.price}</Text>
                </View>

                <View style={styles.tagRow}>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{item.category || 'General'}</Text>
                  </View>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{item.duration || 'N/A'}</Text>
                  </View>
                  {item.featured && (
                    <View style={[styles.tagBadge, { backgroundColor: '#fef3c7' }]}>
                      <Text style={[styles.tagText, { color: '#b45309' }]}>Featured</Text>
                    </View>
                  )}
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity testID="btn-create-outline" accessibilityLabel="create outline"
                    style={styles.actionBtn}
                    onPress={() => openEditModal(item)}
                  >
                    <Ionicons name="create-outline" size={14} color="#2563eb" />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity testID="btn-copy-outline" accessibilityLabel="copy outline"
                    style={styles.actionBtn}
                    onPress={() => handleDuplicate(item)}
                  >
                    <Ionicons name="copy-outline" size={14} color="#7c3aed" />
                    <Text style={[styles.actionBtnText, { color: '#7c3aed' }]}>Copy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity testID="btn-trash-outline" accessibilityLabel="trash outline"
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item.id, item.name)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                    <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No tours found</Text>
            </View>
          }
        />
      )}

      {/* Modal for Create / Edit */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTour ? 'Edit Tour Package' : 'Create New Tour'}
              </Text>
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContent}>
              <Text style={styles.formLabel}>Tour Title *</Text>
              <TextInput style={styles.formInput} value={name} onChangeText={setName} />

              <Text style={styles.formLabel}>Category *</Text>
              <TextInput style={styles.formInput} value={category} onChangeText={setCategory} />

              <Text style={styles.formLabel}>Destination / Location *</Text>
              <TextInput
                style={styles.formInput}
                value={destination}
                onChangeText={setDestination}
              />

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Price ($) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Duration *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Difficulty</Text>
              <TextInput style={styles.formInput} value={difficulty} onChangeText={setDifficulty} />

              <Text style={styles.formLabel}>Image URL</Text>
              <TextInput style={styles.formInput} value={image} onChangeText={setImage} />

              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <View style={styles.checkboxRow}>
                <TouchableOpacity testID="btn-tours-360" accessibilityLabel="tours action"
                  style={styles.checkboxItem}
                  onPress={() => setFeatured(!featured)}
                >
                  <Ionicons
                    name={featured ? 'checkbox' : 'square-outline'}
                    size={20}
                    color="#2563eb"
                  />
                  <Text style={styles.checkboxLabel}>Featured</Text>
                </TouchableOpacity>

                <TouchableOpacity testID="btn-tours-372" accessibilityLabel="tours action"
                  style={styles.checkboxItem}
                  onPress={() => setPopular(!popular)}
                >
                  <Ionicons
                    name={popular ? 'checkbox' : 'square-outline'}
                    size={20}
                    color="#2563eb"
                  />
                  <Text style={styles.checkboxLabel}>Popular</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity testID="btn-save" accessibilityLabel="Save"
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingTour ? 'Update Tour' : 'Create Tour'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBox: {
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
    paddingVertical: 6,
    fontSize: 13,
    color: '#0f172a',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  cardImage: {
    width: 90,
    height: 100,
    backgroundColor: '#e2e8f0',
  },
  cardBody: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 6,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10b981',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 4,
  },
  tagBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  tagText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    backgroundColor: '#eff6ff',
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: '#0f172a',
  },
  formContent: {
    paddingBottom: SPACING.xxl,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: SPACING.sm,
  },
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  formCol: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginVertical: SPACING.sm,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
