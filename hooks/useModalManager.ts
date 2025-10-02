import { useState } from "react";

export type ModalType = "reminder" | "meeting" | "bulk" | "filters" | "leadType";

export default function useModalManager() {
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderLeadId, setReminderLeadId] = useState<string | null>(null);
  const [reminderCallback, setReminderCallback] = useState<(() => void) | null>(null);

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingLeadId, setMeetingLeadId] = useState<string | null>(null);
  const [meetingCallback, setMeetingCallback] = useState<(() => void) | null>(null);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);

  const openReminderModal = (leadId: string, callback?: () => void) => {
    setReminderLeadId(leadId);
    setReminderCallback(() => callback);
    setShowReminderModal(true);
  };

  const closeReminderModal = () => {
    setShowReminderModal(false);
    setReminderLeadId(null);
    setReminderCallback(null);
  };

  const openMeetingModal = (leadId: string, callback?: () => void) => {
    setMeetingLeadId(leadId);
    setMeetingCallback(() => callback);
    setShowMeetingModal(true);
  };

  const closeMeetingModal = () => {
    setShowMeetingModal(false);
    setMeetingLeadId(null);
    setMeetingCallback(null);
  };

  return {
    // Reminder modal
    showReminderModal,
    reminderLeadId,
    reminderCallback,
    openReminderModal,
    closeReminderModal,
    
    // Meeting modal  
    showMeetingModal,
    meetingLeadId,
    meetingCallback,
    openMeetingModal,
    closeMeetingModal,
    
    // Other modals
    showBulkModal,
    setShowBulkModal,
    showFilters,
    setShowFilters,
    headerDropdownOpen,
    setHeaderDropdownOpen,
  };
}
