import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TableData, DataRow } from '@/types';
import api from '@/services/api';

export const useDataStore = defineStore('data', () => {
  const tableDataMap = ref<Map<string, TableData>>(new Map());
  const loading = ref<Set<string>>(new Set());

  async function loadData(fileId: string) {
    if (loading.value.has(fileId)) return;

    loading.value.add(fileId);
    try {
      const { columns, rows } = await api.getData(fileId);
      tableDataMap.value.set(fileId, {
        fileId,
        columns,
        rows,
        modifiedRows: new Set(),
      });
    } catch (error) {
      console.error(`Failed to load data for file ${fileId}:`, error);
      throw error;
    } finally {
      loading.value.delete(fileId);
    }
  }

  function updateRow(fileId: string, rowId: string, updates: Partial<DataRow>) {
    const tableData = tableDataMap.value.get(fileId);
    if (!tableData) return;

    const rowIndex = tableData.rows.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) return;

    tableData.rows[rowIndex] = { ...tableData.rows[rowIndex], ...updates };
    tableData.modifiedRows.add(rowId);
    tableDataMap.value.set(fileId, { ...tableData });
  }

  async function saveChanges(fileId: string) {
    const tableData = tableDataMap.value.get(fileId);
    if (!tableData || tableData.modifiedRows.size === 0) return;

    const modifiedRows = tableData.rows.filter((row) =>
      tableData.modifiedRows.has(row.id)
    );

    try {
      await api.updateData(fileId, modifiedRows);
      tableData.modifiedRows.clear();
      tableDataMap.value.set(fileId, { ...tableData });
    } catch (error) {
      console.error(`Failed to save changes for file ${fileId}:`, error);
      throw error;
    }
  }

  function getTableData(fileId: string): TableData | undefined {
    return tableDataMap.value.get(fileId);
  }

  function isRowModified(fileId: string, rowId: string): boolean {
    const tableData = tableDataMap.value.get(fileId);
    return tableData?.modifiedRows.has(rowId) || false;
  }

  function clearData(fileId: string) {
    tableDataMap.value.delete(fileId);
  }

  return {
    tableDataMap,
    loading,
    loadData,
    updateRow,
    saveChanges,
    getTableData,
    isRowModified,
    clearData,
  };
});
