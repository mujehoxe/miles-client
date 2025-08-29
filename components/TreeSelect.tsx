import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
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
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressHandled = useRef<boolean>(false);

  // Initialize with all parent nodes expanded
  const initializeExpandedNodes = () => {
    const expanded = new Set<string>();
    const collectParentNodes = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          expanded.add(node.value);
          collectParentNodes(node.children);
        }
      });
    };
    collectParentNodes(treeData);
    return expanded;
  };

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() =>
    initializeExpandedNodes()
  );

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

  // Handle single node selection (regular press)
  const handleToggleSelection = (node: TreeNode) => {
    const isSelected = selectedValues.includes(node.value);

    if (isSelected) {
      // Remove only this node
      const newSelected = selectedValues.filter((val) => val !== node.value);
      onSelectionChange(newSelected);
    } else {
      // Add only this node
      const newSelected = [...selectedValues, node.value];
      onSelectionChange(newSelected);
    }
  };

  // Handle subtree selection (immediate on long press threshold)
  const handleToggleSubtreeSelection = (node: TreeNode) => {
    const nodeValues = flattenNodeValues(node);
    const hasAnySelected = nodeValues.some((val) =>
      selectedValues.includes(val)
    );

    if (hasAnySelected) {
      // Remove all node values from subtree
      const newSelected = selectedValues.filter(
        (val) => !nodeValues.includes(val)
      );
      onSelectionChange(newSelected);
    } else {
      // Add all node values from subtree
      const newSelected = [...new Set([...selectedValues, ...nodeValues])];
      onSelectionChange(newSelected);
    }

    // Provide haptic feedback
    Vibration.vibrate(50);
  };

  // Create pan responder for custom long press handling
  const createNodePanResponder = (node: TreeNode) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: () => {
        // Reset long press handled flag
        longPressHandled.current = false;

        // Start long press timer
        longPressTimer.current = setTimeout(() => {
          handleToggleSubtreeSelection(node);
          longPressHandled.current = true;
          longPressTimer.current = null;
        }, 500);
      },
      onPanResponderRelease: () => {
        // Clear timer and handle regular press only if long press hasn't been handled
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        // Only handle regular press if long press wasn't triggered
        if (!longPressHandled.current) {
          handleToggleSelection(node);
        }

        // Reset flag for next interaction
        longPressHandled.current = false;
      },
      onPanResponderTerminate: () => {
        // Clear timer if gesture is interrupted
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        // Reset flag
        longPressHandled.current = false;
      },
    });
  };

  const getNodeSelectionState = (node: TreeNode) => {
    // For individual node selection, just check if this specific node is selected
    const isNodeSelected = selectedValues.includes(node.value);

    // For visual indication of subtree state
    const nodeValues = flattenNodeValues(node);
    const selectedCount = nodeValues.filter((val) =>
      selectedValues.includes(val)
    ).length;

    if (selectedCount === 0) return "none";
    if (selectedCount === nodeValues.length) return "all";
    return "partial";
  };

  // Get selection state for individual node (for the main checkbox)
  const getIndividualNodeState = (node: TreeNode) => {
    return selectedValues.includes(node.value) ? "selected" : "none";
  };

  const renderTreeNode = (node: TreeNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.value);
    const selectionState = getNodeSelectionState(node);
    const indentationWidth = level * 16; // Reduced indentation for better spacing

    return (
      <View key={node.value}>
        <View
          className="flex-row items-center min-h-[48px] px-2"
          style={{ paddingLeft: indentationWidth + 4 }}
        >
          {/* Expand/Collapse Button */}
          <View className="w-6 h-6 items-center justify-center mr-2">
            {hasChildren ? (
              <TouchableOpacity
                onPress={() => handleToggleExpand(node.value)}
                className="w-6 h-6 items-center justify-center rounded"
                activeOpacity={0.6}
              >
                <Ionicons
                  name={isExpanded ? "chevron-down" : "chevron-forward"}
                  size={16}
                  color="#6B7280"
                />
              </TouchableOpacity>
            ) : (
              <View className="w-6 h-6" />
            )}
          </View>

          {/* Selection Checkbox and Label */}
          <View
            className="flex-1 flex-row items-center py-2"
            {...createNodePanResponder(node).panHandlers}
          >
            {/* Individual Node Checkbox */}
            <View
              className={`w-5 h-5 rounded items-center justify-center mr-3 ${
                getIndividualNodeState(node) === "selected"
                  ? "bg-miles-500 border-miles-500"
                  : "border-gray-300 border-2 bg-white"
              }`}
            >
              {getIndividualNodeState(node) === "selected" && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>

            <Text
              className={`text-base flex-1 ${
                level === 0 ? "text-gray-900 font-medium" : "text-gray-700"
              }`}
              numberOfLines={2}
            >
              {node.label}
            </Text>

            {hasChildren &&
              selectionState === "all" &&
              getIndividualNodeState(node) === "none" && (
                <View className="w-3 h-3 rounded-full bg-miles-500 items-center justify-center ml-2">
                  <Ionicons name="checkmark" size={8} color="#FFFFFF" />
                </View>
              )}
          </View>
        </View>

        {/* Children Nodes */}
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
      <View
        key={node.value}
        className="flex-row items-center p-4 border-b border-gray-100"
        {...createNodePanResponder(node).panHandlers}
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
        <Text className="text-base text-gray-700 ml-3 flex-1">
          {node.label}
        </Text>

        {/* Subtree indicator for search results */}
        {node.children && node.children.length > 0 && (
          <Text className="text-xs text-gray-400 ml-2">
            +{flattenNodeValues(node).length - 1}
          </Text>
        )}
      </View>
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
