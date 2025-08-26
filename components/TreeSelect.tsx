import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TreeNode {
  value: string;
  title?: string;
  label: string;
  children?: TreeNode[];
  email?: string;
  personalEmail?: string;
  isVerified?: boolean;
}

interface TreeSelectProps {
  title: string;
  treeData: TreeNode[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
}

export default function TreeSelect({
  title,
  treeData,
  selectedValues,
  onSelectionChange,
  placeholder = "Select agents...",
}: TreeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Flatten tree for search
  const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children) {
        result.push(...flattenTree(node.children));
      }
    });
    return result;
  };

  const allNodes = flattenTree(treeData);
  const filteredNodes = searchText 
    ? allNodes.filter(node => 
        node.label.toLowerCase().includes(searchText.toLowerCase())
      )
    : treeData;

  // Get all values from a node and its children
  const flattenNodeValues = (node: TreeNode): string[] => {
    let values = [node.value];
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        values = values.concat(flattenNodeValues(child));
      });
    }
    return values;
  };

  const handleToggleExpand = (nodeValue: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeValue)) {
      newExpanded.delete(nodeValue);
    } else {
      newExpanded.add(nodeValue);
    }
    setExpandedNodes(newExpanded);
  };

  const handleToggleSelection = (node: TreeNode) => {
    const nodeValues = flattenNodeValues(node);
    const hasAnySelected = nodeValues.some(val => selectedValues.includes(val));
    
    if (hasAnySelected) {
      // Remove all node values
      const newSelected = selectedValues.filter(val => !nodeValues.includes(val));
      onSelectionChange(newSelected);
    } else {
      // Add all node values
      const newSelected = [...new Set([...selectedValues, ...nodeValues])];
      onSelectionChange(newSelected);
    }
  };

  const getNodeSelectionState = (node: TreeNode) => {
    const nodeValues = flattenNodeValues(node);
    const selectedCount = nodeValues.filter(val => selectedValues.includes(val)).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === nodeValues.length) return 'all';
    return 'partial';
  };

  const renderTreeNode = (node: TreeNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.value);
    const selectionState = getNodeSelectionState(node);
    
    return (
      <View key={node.value} style={{ paddingLeft: level * 20 }}>
        <TouchableOpacity style={styles.nodeRow}>
          {hasChildren && (
            <TouchableOpacity 
              onPress={() => handleToggleExpand(node.value)}
              style={styles.expandButton}
            >
              <Ionicons 
                name={isExpanded ? "chevron-down" : "chevron-forward"} 
                size={16} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.nodeContent}
            onPress={() => handleToggleSelection(node)}
          >
            <View style={[
              styles.checkbox,
              selectionState === 'all' && styles.checkboxSelected,
              selectionState === 'partial' && styles.checkboxPartial,
            ]}>
              {selectionState === 'all' && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              {selectionState === 'partial' && <View style={styles.partialIndicator} />}
            </View>
            
            <Text style={styles.nodeText}>{node.label}</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {hasChildren && isExpanded && (
          <View>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const renderSearchResults = () => {
    return filteredNodes.map(node => (
      <TouchableOpacity 
        key={node.value}
        style={styles.searchResultRow}
        onPress={() => handleToggleSelection(node)}
      >
        <View style={[
          styles.checkbox,
          selectedValues.includes(node.value) && styles.checkboxSelected,
        ]}>
          {selectedValues.includes(node.value) && 
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          }
        </View>
        <Text style={styles.nodeText}>{node.label}</Text>
      </TouchableOpacity>
    ));
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const node = allNodes.find(n => n.value === selectedValues[0]);
      return node?.label || placeholder;
    }
    return `${selectedValues.length} agents selected`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.dropdownText}>{getDisplayText()}</Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => onSelectionChange([])}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search agents..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <ScrollView style={styles.treeContainer}>
            {searchText ? renderSearchResults() : treeData.map(node => renderTreeNode(node))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => setIsOpen(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  clearText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  treeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  expandButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 16,
  },
  nodeText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxPartial: {
    backgroundColor: '#F3F4F6',
    borderColor: '#3B82F6',
  },
  partialIndicator: {
    width: 8,
    height: 2,
    backgroundColor: '#3B82F6',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  doneButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
