/**
 * Modal Manager
 * 
 * A utility class to manage modals in the application and prevent multiple
 * modals from being opened simultaneously, which can cause view registration issues.
 */

class ModalManager {
  private static instance: ModalManager;
  private activeModals: Set<string> = new Set();
  private closeCallbacks: Map<string, () => void> = new Map();
  private activeTransitions: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Get the singleton instance of ModalManager
   */
  public static getInstance(): ModalManager {
    if (!ModalManager.instance) {
      ModalManager.instance = new ModalManager();
    }
    return ModalManager.instance;
  }

  /**
   * Register a modal when it opens
   * @param modalId Unique identifier for the modal
   * @param closeCallback Function to call when the modal needs to be closed
   * @returns Boolean indicating if the modal was successfully registered
   */
  public registerModal(modalId: string, closeCallback: () => void): boolean {
    // If there's an active transition for this modal, clear it
    if (this.activeTransitions.has(modalId)) {
      clearTimeout(this.activeTransitions.get(modalId)!);
      this.activeTransitions.delete(modalId);
    }

    // Store the close callback
    this.closeCallbacks.set(modalId, closeCallback);
    
    // Add to active modals
    this.activeModals.add(modalId);
    return true;
  }

  /**
   * Unregister a modal when it closes
   * @param modalId Unique identifier for the modal
   */
  public unregisterModal(modalId: string): void {
    // Start a transition to ensure the modal is fully unregistered after animation
    const timeout = setTimeout(() => {
      this.activeModals.delete(modalId);
      this.closeCallbacks.delete(modalId);
      this.activeTransitions.delete(modalId);
    }, 300); // Match this with modal animation duration

    this.activeTransitions.set(modalId, timeout);
  }

  /**
   * Check if a modal can be opened
   * @param modalId Unique identifier for the modal
   * @returns Boolean indicating if the modal can be opened
   */
  public canOpenModal(modalId: string): boolean {
    // Always allow the modal to open if it's already active
    if (this.activeModals.has(modalId)) {
      return true;
    }
    
    // Don't allow opening if there are active transitions
    if (this.activeTransitions.size > 0) {
      return false;
    }
    
    // If no other modals are active, allow this one
    return this.activeModals.size === 0;
  }

  /**
   * Close all other modals before opening a new one
   * @param exceptModalId Modal ID to exclude from closing
   */
  public closeAllExcept(exceptModalId: string): void {
    for (const modalId of this.activeModals) {
      if (modalId !== exceptModalId) {
        const closeCallback = this.closeCallbacks.get(modalId);
        if (closeCallback) {
          closeCallback();
        }
      }
    }
  }

  /**
   * Check if a modal is currently active
   * @param modalId Unique identifier for the modal
   * @returns Boolean indicating if the modal is active
   */
  public isModalActive(modalId: string): boolean {
    return this.activeModals.has(modalId);
  }

  /**
   * Get count of currently active modals
   * @returns Number of active modals
   */
  public getActiveModalCount(): number {
    return this.activeModals.size;
  }
}

export default ModalManager.getInstance();
