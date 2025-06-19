import React, { useState, useEffect } from 'react';
import { notificationSystem, ItemNotification } from '../services/NotificationSystem';

export const NotificationDisplay: React.FC = () => {
  const [notifications, setNotifications] = useState<ItemNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationSystem.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-32 right-4 z-40 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: ItemNotification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Fade in
    const fadeInTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Start fade out before removal
    const fadeOutTimer = setTimeout(() => {
      setIsExiting(true);
    }, notification.duration - 500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
    };
  }, [notification.duration]);

  const totalItems = notification.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div 
      className={`
        bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-green-400 border-opacity-40
        transform transition-all duration-300 max-w-xs
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-center gap-2">
        <div className="text-green-400 text-sm font-medium">+{totalItems}</div>
        <div className="flex items-center gap-1">
          {notification.items.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className="text-lg">{item.icon}</span>
              {item.quantity > 1 && (
                <span className="text-xs text-gray-300">×{item.quantity}</span>
              )}
            </div>
          ))}
          {notification.items.length > 3 && (
            <span className="text-xs text-gray-400">+{notification.items.length - 3} more</span>
          )}
        </div>
      </div>
      
      {notification.message && (
        <div className="text-xs text-gray-300 mt-1 truncate">
          {notification.message}
        </div>
      )}
    </div>
  );
};