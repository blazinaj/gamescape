export interface ItemNotification {
  id: string;
  message: string;
  items: {
    name: string;
    icon: string;
    quantity: number;
  }[];
  timestamp: number;
  duration: number;
}

export class NotificationSystem {
  private static instance: NotificationSystem | null = null;
  private notifications: ItemNotification[] = [];
  private subscribers: ((notifications: ItemNotification[]) => void)[] = [];

  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }

  showItemNotification(
    message: string,
    items: { name: string; icon: string; quantity: number }[],
    duration: number = 3000
  ): void {
    const notification: ItemNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      items,
      timestamp: Date.now(),
      duration
    };

    this.notifications.push(notification);
    this.notifySubscribers();

    // Auto-remove after duration
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, duration);
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifySubscribers();
  }

  getNotifications(): ItemNotification[] {
    return [...this.notifications];
  }

  subscribe(callback: (notifications: ItemNotification[]) => void): () => void {
    this.subscribers.push(callback);
    callback([...this.notifications]);

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback([...this.notifications]);
    });
  }
}

// Export singleton instance
export const notificationSystem = NotificationSystem.getInstance();