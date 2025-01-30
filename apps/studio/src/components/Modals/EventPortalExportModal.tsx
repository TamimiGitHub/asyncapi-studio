import { useState, useEffect } from 'react';
import { create } from '@ebay/nice-modal-react';
import { ConfirmModal } from './ConfirmModal';
import { toast } from 'react-hot-toast';
import { useServices } from '@/services';

export const EventPortalExport = create(() => {
  const { settingsSvc, editorSvc } = useServices();
  const settings = settingsSvc.get();
  const [epAppDomains, setEpAppDomain] = useState<{ id: string; name: string }[]>([]);
  const [token] = useState(settings.eventportal.token);
  const [importDomain, setImportDomain] = useState('');
  const [specb64, setSpec64] = useState('');
  const [versionStrategy, setVersionStrategy] = useState('MAJOR');
  const [exportsEventsOnly, setExportEventsOnly] = useState(false);
  const [disableCascadeUpdate, setDisableCascadeUpdate] = useState(false);
  
  const IMPORTER_URL = 'https://ep-asyncapi-importer.cfapps.ca10.hana.ondemand.com/importer';

  const exportSpec = () => {
    toast.promise(
      (async function () {
        const appDomainID = epAppDomains.find(domain => domain.name === importDomain)?.id;
        if (!appDomainID) {
          throw new Error('Application Domain ID not found');
        }

        const fetchWithTimeout = (url:any, options:any, timeout = 10000) => {
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              reject(new Error('Request timed out'));
            }, timeout);

            fetch(url, options)
              .then(response => {
                clearTimeout(timer);
                resolve(response);
              })
              .catch(err => {
                clearTimeout(timer);
                reject(err);
              });
          });
        };

        const response:any = await fetchWithTimeout(`${IMPORTER_URL}?appDomainId=${appDomainID}&urlRegion=${settings.eventportal.region}&newVersionStrategy=${versionStrategy}&eventsOnly=${exportsEventsOnly}&disableCascadeUpdate=${disableCascadeUpdate}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            epToken: btoa(token),
            asyncApiSpec: specb64
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }()),
      {
        loading: 'Exporting spec file to Event Portal...',
        success: 'Application exported!',
        error: (err) => err.message,
      },
    );
  };

  async function getApplicationDomains() {
    const response = await fetch(`${IMPORTER_URL}/appdomains?urlRegion=${settings.eventportal.region}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        epToken: btoa(token)
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const domains = (await response.json()).applicationDomains;
    setEpAppDomain(domains)
  }

  const isEPTokenSet = () => {
    return token !== ''
  }

  async function getSpec() {
    setSpec64(await editorSvc.exportAsBase64())
  }

  useEffect(() => {
    getSpec()
    isEPTokenSet() ? getApplicationDomains() : null;
  }, [token, importDomain]);

  return (
    <ConfirmModal
      containerClassName="sm:max-w-6xl"
      title="Export To Solace Event Portal"
      warning={isEPTokenSet() ? null : 'Token not set! Set in Settings -->  Solace Event Portal'}
      confirmText="Export To Solace Event Portal"
      confirmDisabled={!isEPTokenSet() || (importDomain === '')} 
      onSubmit={exportSpec}
      closeAfterSumbit={false}
    >
      <div className="flex content-center justify-center flex-col">
        <div className="flex mt-4 flex-row content-center justify-between ">
          <label className="flex justify-right items-center w-1/2 content-center font-medium text-gray-700">
            Target Application Domain
          </label>
          <select
            name="domain"
            className="shadow-sm focus:ring-pink-500 focus:border-pink-500 w-1/2 block rounded-md py-1 text-gray-700 border-pink-300 border-2"
            onChange={e => setImportDomain(e.target.value === 'default' ? '' : e.target.value)}
            value={importDomain}
          >
            <option value="default">Select Domain</option>
            {epAppDomains.map((domain: any) => (
              <option key={domain.id} value={domain.name}>
                {domain.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex mt-4 flex-row content-center justify-between ">
          <label className="flex justify-right items-center w-1/2 content-center font-medium text-gray-700">
            Increment version strategy
          </label>
          <select
            name="increment_strategy"
            className="shadow-sm focus:ring-pink-500 focus:border-pink-500 w-1/2 block rounded-md py-1 text-gray-700 border-pink-300 border-2"
            onChange={e => setVersionStrategy(e.target.value)}
            value={versionStrategy}
          >
            <option value="MAJOR">Major</option>
            <option value="MINOR">Minor</option>
            <option value="PATCH">Patch</option>
          </select>
        </div>
        <div className="flex mt-4">
          <label className="inline-flex justify-between items-center">
            <input 
              type="checkbox" 
              className="form-checkbox" 
              name='events_only' 
              checked={exportsEventsOnly} 
              onChange={e => setExportEventsOnly(e.target.checked)} 
            />
            <span className="ml-2">Export Events only</span>
          </label>
        </div>
        <div className="flex mt-4">
          <label className="inline-flex justify-between items-center">
            <input 
              type="checkbox" 
              className="form-checkbox" 
              name='cascade' 
              checked={disableCascadeUpdate} 
              onChange={e => setDisableCascadeUpdate(e.target.checked)} 
            />
            <span className="ml-2">Disable cascade update</span>
          </label>
        </div>
      </div>
    </ConfirmModal>
  );
});
