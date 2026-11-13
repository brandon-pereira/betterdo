import { useNavigate } from "react-router-dom";

import _NotificationBanner from "@components/NotificationBanner";
import usePushNotifications from "@hooks/usePushNotifications";
import useInstall from "@hooks/useInstall";
import useCurrentListId from "@hooks/useCurrentListId";
import useListDetails from "@hooks/useListDetails";
import useDarkMode from "@hooks/useDarkMode";
import useModifyProfile from "@hooks/useModifyProfile";
import useTimezones from "@hooks/useTimezones";
import useProfile from "@hooks/useProfile";
import useLocalStorage from "@hooks/useLocalStorage";
import { formatPeriod, getReadyRecapKey } from "@utilities/wrappedPeriod";

function NotificationBanner() {
  const modifyProfile = useModifyProfile();
  const currentListId = useCurrentListId();
  const [darkMode, setPrefersDarkMode] = useDarkMode();
  const { list, loading, error } = useListDetails(currentListId);
  const { notificationStatus, onRequestNotificationAccess, onDeclineNotificationAccess } = usePushNotifications();
  const { onRequestInstall, onDeclineInstall, isInstallAvailable } = useInstall();
  const { isTimezoneChanged, localTimeZone, setDismissed } = useTimezones();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [dismissedRecapKey, setDismissedRecapKey] = useLocalStorage<string>("dismissedRecap", null);

  if (isInstallAvailable) {
    return (
      <_NotificationBanner
        title="Install App"
        description="Install our application to more quickly access your tasks."
        primaryButtonCopy="Install"
        primaryButtonAction={onRequestInstall}
        secondaryButtonCopy="Dismiss"
        secondaryButtonAction={onDeclineInstall}
      />
    );
  }

  let doesListHaveNotifications = false;
  if (!loading && !error && list && list.members && list.tasks) {
    const isSharedList = list.members.length > 1;
    const doesListHaveDueDates = Boolean(list.tasks.find(task => task.dueDate));
    doesListHaveNotifications = isSharedList || doesListHaveDueDates;
  }

  if (doesListHaveNotifications && notificationStatus === "UNKNOWN") {
    return (
      <_NotificationBanner
        title="Get notified"
        description="Enable push notifications so we can notify you when a task is due as well as when a friend updates a shared list."
        primaryButtonCopy="Enable"
        primaryButtonAction={onRequestNotificationAccess}
        secondaryButtonCopy="Dismiss"
        secondaryButtonAction={onDeclineNotificationAccess}
      />
    );
  }

  if (!darkMode && typeof darkMode === "undefined") {
    return (
      <_NotificationBanner
        title="Dark Mode"
        description="BetterDo now offers dark mode! Would you like to try it out?"
        primaryButtonCopy="Enable"
        primaryButtonAction={() => setPrefersDarkMode(true)}
        secondaryButtonCopy="Dismiss"
        secondaryButtonAction={() => setPrefersDarkMode(false)}
      />
    );
  }

  if (isTimezoneChanged && localTimeZone) {
    return (
      <_NotificationBanner
        title="Timezone Changed"
        description="Your browsing from a different timezone than what we have on file. Would you like us to adjust your timezone settings?"
        primaryButtonCopy="Adjust"
        primaryButtonAction={() => modifyProfile({ timeZone: localTimeZone })}
        secondaryButtonCopy="Dismiss"
        secondaryButtonAction={() => setDismissed(true)}
      />
    );
  }

  const recapKey = getReadyRecapKey(profile?.creationDate);
  if (recapKey && recapKey !== dismissedRecapKey) {
    const isYear = !recapKey.includes("-");
    return (
      <_NotificationBanner
        title={isYear ? `Your ${recapKey} Wrapped is ready` : `Your ${formatPeriod(recapKey)} recap is ready`}
        description={`See what you got done, your longest streak, and your busiest days in ${formatPeriod(recapKey)}.`}
        primaryButtonCopy="View"
        primaryButtonAction={() => {
          setDismissedRecapKey(recapKey);
          navigate(`/wrapped/${recapKey}`);
        }}
        secondaryButtonCopy="Dismiss"
        secondaryButtonAction={() => setDismissedRecapKey(recapKey)}
      />
    );
  }

  return null;
}

export default NotificationBanner;
