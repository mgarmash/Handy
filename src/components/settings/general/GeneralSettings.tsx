import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { type } from "@tauri-apps/plugin-os";
import { MicrophoneSelector } from "../MicrophoneSelector";
import { ShortcutInput } from "../ShortcutInput";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { OutputDeviceSelector } from "../OutputDeviceSelector";
import { PushToTalk } from "../PushToTalk";
import { AudioFeedback } from "../AudioFeedback";
import { useSettings } from "../../../hooks/useSettings";
import { VolumeSlider } from "../VolumeSlider";
import { MuteWhileRecording } from "../MuteWhileRecording";
import { ModelSettingsCard } from "./ModelSettingsCard";
import { commands } from "@/bindings";
import type { ApiDestination } from "@/bindings";

export const GeneralSettings: React.FC = () => {
  const { t } = useTranslation();
  const { audioFeedbackEnabled, getSetting, settings, refreshSettings } =
    useSettings();
  const pushToTalk = getSetting("push_to_talk");
  const isLinux = type() === "linux";
  const apiDestinations: ApiDestination[] =
    settings?.api_destinations ?? [];
  const [addingApiDest, setAddingApiDest] = useState(false);

  const handleUpdateApiUrl = useCallback(
    async (id: string, url: string) => {
      try {
        await commands.updateApiDestinationUrl(id, url);
        await refreshSettings();
      } catch (e) {
        console.error("Failed to update API destination URL:", e);
      }
    },
    [refreshSettings],
  );

  const handleAddApiDestination = useCallback(async () => {
    setAddingApiDest(true);
    try {
      await commands.addApiDestination();
      await refreshSettings();
    } catch (e) {
      console.error("Failed to add API destination:", e);
    } finally {
      setAddingApiDest(false);
    }
  }, [refreshSettings]);

  const handleDeleteApiDestination = useCallback(
    async (id: string) => {
      try {
        await commands.deleteApiDestination(id);
        await refreshSettings();
      } catch (e) {
        console.error("Failed to delete API destination:", e);
      }
    },
    [refreshSettings],
  );

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <SettingsGroup title={t("settings.general.title")}>
        <ShortcutInput shortcutId="transcribe" grouped={true} />
        <PushToTalk descriptionMode="tooltip" grouped={true} />
        {/* Cancel shortcut is hidden with push-to-talk (release key cancels) and on Linux (dynamic shortcut instability) */}
        {!isLinux && !pushToTalk && (
          <ShortcutInput shortcutId="cancel" grouped={true} />
        )}
      </SettingsGroup>
      <ModelSettingsCard />
      {apiDestinations.length > 0 && (
        <SettingsGroup title={t("settings.general.apiDestinations.title")}>
          <p className="text-sm text-muted-foreground mb-4">
            {t("settings.general.apiDestinations.description")}
          </p>
          {apiDestinations.map((dest) => (
            <div
              key={dest.id}
              className="flex items-center gap-3 mb-3"
            >
              <div className="flex-1 min-w-0">
                <ShortcutInput shortcutId={dest.id} grouped={true} />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="url"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  placeholder={t(
                    "settings.general.apiDestinations.urlPlaceholder",
                  )}
                  value={dest.url}
                  onChange={(e) =>
                    handleUpdateApiUrl(dest.id, e.target.value)
                  }
                />
              </div>
              <button
                type="button"
                className="px-2 py-1 text-sm text-destructive hover:underline"
                onClick={() => handleDeleteApiDestination(dest.id)}
                aria-label={t("common.delete")}
              >
                {t("common.delete")}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="mt-2 text-sm text-primary hover:underline"
            onClick={handleAddApiDestination}
            disabled={addingApiDest}
          >
            {addingApiDest
              ? t("common.loading")
              : t("settings.general.apiDestinations.add")}
          </button>
        </SettingsGroup>
      )}
      <SettingsGroup title={t("settings.sound.title")}>
        <MicrophoneSelector descriptionMode="tooltip" grouped={true} />
        <MuteWhileRecording descriptionMode="tooltip" grouped={true} />
        <AudioFeedback descriptionMode="tooltip" grouped={true} />
        <OutputDeviceSelector
          descriptionMode="tooltip"
          grouped={true}
          disabled={!audioFeedbackEnabled}
        />
        <VolumeSlider disabled={!audioFeedbackEnabled} />
      </SettingsGroup>
    </div>
  );
};
