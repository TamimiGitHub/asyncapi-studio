import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { create, useModal } from '@ebay/nice-modal-react';

import { SettingsTabs, SettingTab } from './SettingsTabs';

import { ConfirmModal } from '../index';
import { Switch } from '../../common';

import { useServices } from '@/services';

import type { Dispatch, SetStateAction, FunctionComponent } from 'react';
import type { SettingsState } from '@/state/settings.state';

interface ShowGovernanceOptionProps {
  label: 'warning' | 'information' | 'hint';
  state: boolean;
  setState: Dispatch<SetStateAction<boolean>>;
}

const ShowGovernanceOption: FunctionComponent<ShowGovernanceOptionProps> = ({
  label,
  state,
  setState
}) => {
  return (
    <div>
      <div className="flex flex-col mt-4 text-sm">
        <div className="flex flex-row content-center justify-between">
          <label
            htmlFor={`settings-governance-show-${label}`}
            className="flex justify-right items-center w-1/2 content-center font-medium text-gray-700"
          >
            Show&nbsp;<strong>{label}</strong>&nbsp;governance issues
          </label>
          <Switch
            toggle={state}
            onChange={setState}
          />
        </div>
        <div className='text-gray-400 text-xs'>
          Show {label} governance issues in the editor&apos;s&nbsp;<strong>Diagnostics</strong>&nbsp;tab.
        </div>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  activeTab?: 'editor' | 'governance' | 'template';
}

export const SettingsModal = create<SettingsModalProps>(({ activeTab = 'editor' }) => {
  const { settingsSvc } = useServices();
  const settings = settingsSvc.get();
  const modal = useModal();

  const [autoSaving, setAutoSaving] = useState(settings.editor.autoSaving);
  const [savingDelay, setSavingDelay] = useState(settings.editor.savingDelay);
  const [governanceWarnings, setGovernanceWarnings] = useState(settings.governance.show.warnings);
  const [governanceInformations, setGovernanceInformations] = useState(settings.governance.show.informations);
  const [governanceHints, setGovernanceHints] = useState(settings.governance.show.hints);
  const [autoRendering, setAutoRendering] = useState(settings.templates.autoRendering);
  const [token, setEpToken] = useState(settings.eventportal.token);
  const [maskedToken, setMaskedToken] = useState('*'.repeat(settings.eventportal.token.length));
  const [epRegion, setEPRegion] = useState(settings.eventportal.region);
  const [confirmDisabled, setConfirmDisabled] = useState(true);
  const IMPORTER_URL = 'https://ep-asyncapi-importer.cfapps.ca10.hana.ondemand.com/importer';

  const createNewState = (): SettingsState => {
    return {
      editor: {
        autoSaving,
        savingDelay,
      },
      governance: {
        show: {
          warnings: governanceWarnings,
          informations: governanceInformations,
          hints: governanceHints,
        },
      },
      templates: {
        autoRendering,
      },
      eventportal: {
        token,
        region: epRegion,
      }
    };
  };

  useEffect(() => {
    const newState = createNewState();
    const isThisSameObjects = settingsSvc.isEqual(newState);
    setConfirmDisabled(isThisSameObjects);
  }, [autoSaving, savingDelay, autoRendering, governanceWarnings, governanceInformations, governanceHints, token, epRegion]);

  const onCancel = useCallback(() => {
    modal.hide();
  }, []);

  const onSubmit = () => {
    const newState = createNewState();
    settingsSvc.set(newState);

    toast.success(
      <div>
        <span className="block text-bold">
          Settings successfully saved!
        </span>
      </div>
    );
    onCancel();
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value;
    setEpToken(newToken);
    setMaskedToken('*'.repeat(newToken.length));
  };

  const tabs: Array<SettingTab> = [
    {
      name: 'editor',
      tab: <span>Editor</span>,
      content: (
        <div>
          <div className="flex flex-col mt-4 text-sm">
            <div className="flex flex-row content-center justify-between">
              <label
                htmlFor="settings-auto-saving"
                className="flex justify-right items-center w-1/2 content-center font-medium text-gray-700"
              >
                Auto saving
              </label>
              <Switch
                toggle={autoSaving}
                onChange={(v) => setAutoSaving(v)}
              />
            </div>
            <div className='text-gray-400 text-xs'>
              Save automatically after each change in the document or manually.
            </div>
          </div>
          <div className="flex flex-col mt-4 text-sm">
            <div className="flex flex-row content-center justify-between">
              <label
                htmlFor="settings-template-delay"
                className="flex justify-right items-center w-1/2 content-center font-medium text-gray-700"
              >
                Delay (in miliseconds)
              </label>
              <select
                name="settings-template-delay"
                className="shadow-sm focus:ring-pink-500 focus:border-pink-500 w-1/4 block sm:text-sm rounded-md py-2 px-1 text-gray-700 border-pink-300 border-2"
                onChange={e => setSavingDelay(JSON.parse(e.target.value))}
                value={autoSaving ? savingDelay : ''}
                disabled={!autoSaving}
              >
                <option value="">Please Select</option>
                {[250, 500, 625, 750, 875, 1000].map(v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className='text-gray-400 text-xs -mt-2'>
              Delay in saving the modified document.
            </div>
          </div>
        </div>
      ),
    },
    {
      name: 'governance',
      tab: <span>Governance</span>,
      content: (
        <>
          <ShowGovernanceOption label='warning' state={governanceWarnings} setState={setGovernanceWarnings} />
          <ShowGovernanceOption label='information' state={governanceInformations} setState={setGovernanceInformations} />
          <ShowGovernanceOption label='hint' state={governanceHints} setState={setGovernanceHints} />
        </>
      ),
    },
    {
      name: 'templates',
      tab: <span>Templates</span>,
      content: (
        <div>
          <div className="flex flex-col mt-4 text-sm">
            <div className="flex flex-row content-center justify-between">
              <label
                htmlFor="asyncapi-version"
                className="flex justify-right items-center w-1/2 content-center font-medium text-gray-700"
              >
                Auto rendering
              </label>
              <Switch
                toggle={autoRendering}
                onChange={(v) => setAutoRendering(v)}
              />
            </div>
          </div>
          <div className='text-gray-400 text-xs'>
            Automatic rendering after each change in the document or manually.
          </div>
        </div>
      ),
    },
    {
      name: 'eventportal',
      tab: <span>Solace Event Portal</span>,
      content: (
        <div>
          <div className="flex flex-col mt-4 ">
            <label className="flex justify-right items-center w-1/2 content-center font-medium text-gray-700">
              Choose your Solace Cloud Region
            </label>
            <select
              name="region"
              className="shadow-sm focus:ring-pink-500 focus:border-pink-500 w-1/2 block rounded-md py-1 text-gray-700 border-pink-300 border-2"
              onChange={e => setEPRegion(e.target.value)}
              value={epRegion}
            >
              <option value="us">US</option>
              <option value="au">AU</option>
              <option value="eu">EU</option>
              <option value="sg">SG</option>
            </select>
          </div>
          <div className="flex flex-col mt-4">
            <div>
              Input your Solace Event Portal Token
            </div>
            <input
              name="token"
              placeholder={token !== '' ? maskedToken : 'Solace PubSub+ Event Portal Token'}
              className="shadow-sm focus:ring-pink-500 focus:border-pink-500 w-1/2 block sm:text-sm rounded-md p-1 text-gray-700 border-pink-300 border-2"
              onChange={handleTokenChange}
              value={maskedToken}
            />
          </div>
          <button
            className="mt-4 bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              toast.promise(
                (async function () {
                  const response = await fetch(`${IMPORTER_URL}/validate-token?urlRegion=${epRegion}`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      epToken: btoa(token),
                    }),
                  });
                  const result = await response.json();
                  if (!result.msgs) {
                    throw new Error('Token verification failed');
                  }
                }()),
                {
                  loading: 'Verifying token...',
                  success: 'Token verified!',
                  error: 'Token verification failed'
                }
              );
            }}
          > Verify Token</button>
        </div>
      ),
    },
  ];

  return (
    <ConfirmModal
      title='Studio settings'
      confirmText="Save"
      confirmDisabled={confirmDisabled}
      onSubmit={onSubmit}
      onCancel={onCancel}
    >
      <SettingsTabs active={activeTab} tabs={tabs} />
    </ConfirmModal>
  );
});
