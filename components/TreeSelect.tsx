import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  const [searchText, setSearchText] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Flatten tree for search
  const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    nodes.forEach((node) => {
      result.push(node);
      if (node.children) {
        result.push(...flattenTree(node.children));
      }
    });
    return result;
  };

  const allNodes = flattenTree(treeData);
  const filteredNodes = searchText
    ? allNodes.filter((node) =>
        node.label.toLowerCase().includes(searchText.toLowerCase())
      )
    : treeData;

  // Get all values from a node and its children
  const flattenNodeValues = (node: TreeNode): string[] => {
    let values = [node.value];
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
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
    const hasAnySelected = nodeValues.some((val) =>
      selectedValues.includes(val)
    );

    if (hasAnySelected) {
      // Remove all node values
      const newSelected = selectedValues.filter(
        (val) => !nodeValues.includes(val)
      );
      onSelectionChange(newSelected);
    } else {
      // Add all node values
      const newSelected = [...new Set([...selectedValues, ...nodeValues])];
      onSelectionChange(newSelected);
    }
  };

  const getNodeSelectionState = (node: TreeNode) => {
    const nodeValues = flattenNodeValues(node);
    const selectedCount = nodeValues.filter((val) =>
      selectedValues.includes(val)
    ).length;

    if (selectedCount === 0) return "none";
    if (selectedCount === nodeValues.length) return "all";
    return "partial";
  };

  const renderTreeNode = (node: TreeNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.value);
    const selectionState = getNodeSelectionState(node);

    return (
      <View key={node.value} style={{ paddingLeft: level * 20 }}>
        <TouchableOpacity className="flex-row items-center min-h-[48px]">
          {hasChildren && (
            <TouchableOpacity
              onPress={() => handleToggleExpand(node.value)}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons
                name={isExpanded ? "chevron-down" : "chevron-forward"}
                size={16}
                color="#6B7280"
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="flex-1 flex-row items-center py-3 pr-4"
            onPress={() => handleToggleSelection(node)}
          >
            <View
              className={`w-5 h-5 rounded border-2 items-center justify-center ${
                selectionState === "all"
                  ? "bg-miles-500 border-miles-500"
                  : selectionState === "partial"
                  ? "bg-gray-100 border-miles-500"
                  : "border-gray-300"
              }`}
            >
              {selectionState === "all" && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
              {selectionState === "partial" && (
                <View className="w-2 h-0.5 bg-miles-500" />
              )}
            </View>

            <Text className="text-base text-gray-700 ml-3">{node.label}</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {hasChildren && isExpanded && (
          <View>
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const renderSearchResults = () => {
    return filteredNodes.map((node) => (
      <TouchableOpacity
        key={node.value}
        className="flex-row items-center p-4 border-b border-gray-100"
        onPress={() => handleToggleSelection(node)}
      >
        <View
          className={`w-5 h-5 rounded border-2 items-center justify-center ${
            selectedValues.includes(node.value)
              ? "bg-miles-500 border-miles-500"
              : "border-gray-300"
          }`}
        >
          {selectedValues.includes(node.value) && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
        <Text className="text-base text-gray-700 ml-3">{node.label}</Text>
      </TouchableOpacity>
    ));
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const node = allNodes.find((n) => n.value === selectedValues[0]);
      return node?.label || placeholder;
    }
    return `${selectedValues.length} agents selected`;
  };

  return (
    <View className="mb-4">
      <TouchableOpacity
        className="flex-row items-center justify-between bg-white border border-gray-300 rounded-lg p-3 min-h-[48px]"
        onPress={() => setIsOpen(true)}
      >
        <Text className="text-base text-gray-700 flex-1">
          {getDisplayText()}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">{title}</Text>
            <TouchableOpacity onPress={() => onSelectionChange([])}>
              <Text className="text-red-500 text-base font-medium">Clear</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-white border-b border-gray-200 px-4 py-3">
            <Ionicons
              name="search"
              size={20}
              color="#6B7280"
              className="mr-2"
            />
            <TextInput
              className="flex-1 text-base text-gray-900"
              placeholder="Search agents..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <ScrollView className="flex-1 bg-white">
            {searchText
              ? renderSearchResults()
              : treeData.map((node) => renderTreeNode(node))}
          </ScrollView>

          <View className="p-4 bg-white border-t border-gray-200">
            <TouchableOpacity
              className="bg-miles-500 rounded-lg p-4 items-center"
              onPress={() => setIsOpen(false)}
            >
              <Text className="text-white text-base font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
