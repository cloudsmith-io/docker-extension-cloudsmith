import React from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TabPanel from './components/TabPanel';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import { Typography, AppBar, IconButton, Toolbar, Tooltip } from '@mui/material';
import { QuestionMark } from '@mui/icons-material';
import SyncIcon from '@mui/icons-material/Sync';
import { Images, Image, ImageState } from './Images';
import { Info } from './Info';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';

// Note: This line relies on Docker Desktop's presence as a host application.
// If you're running this React app in a browser, it won't work properly.
const client = createDockerDesktopClient();
const REGISTRY = 'docker.cloudsmith.io';

function useDockerDesktopClient() {
  return client;
}

export const copyToClipboard = (value: string, showValue = true) => {
  navigator.clipboard.writeText(value);
  useDockerDesktopClient()?.desktopUI?.toast?.success(showValue ? `${value} copied to clipboard` : "Copied to clipboard");
};
export const openExternal = (value: string) => {
  useDockerDesktopClient()?.host?.openExternal(value);
};

let allImages: Image[] = [];

interface DockerImage {
  RepoTags: string[];
}

interface localStorageData {
  images: Image[];
  groupImages: boolean;
  pullByVersion: boolean;
  creds: {
    api_key: string;
    organization: string;
    repo: string;
  }
}

const importData = async (): Promise<localStorageData> => {
  if (localStorage.hasOwnProperty(REGISTRY)) {
    return Promise.resolve(
      JSON.parse(localStorage.getItem(REGISTRY) || ''),
    ).then((data) => data);
  }
  return {images: [], creds: {api_key: '', organization: '', repo: ''}, groupImages: false, pullByVersion: false};
};

const loadDockerImages = () => {
  if (client?.docker?.listImages) {
    return client.docker.listImages().then((list) => {
      return (list as DockerImage[])
        .filter((el) => el.RepoTags)
        .flatMap((el) => el.RepoTags)
        .filter((el) => el.startsWith(REGISTRY));
    });
  }
  return Promise.resolve([]);
};

export function App() {
  const [imported, setImported] = React.useState(false);
  const [value, setValue] = React.useState(0);
  const [images, setImages] = React.useState<Image[]>(allImages);
  const [imagesState, setImagesState] = React.useState<ImageState>({});
  const [groupImages, setGroupImages] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);
  const [apiKey, setAPIKey] = React.useState('');
  const [organization, setOrg] = React.useState('');
  const [repository, setRepo] = React.useState('');
  const ddClient = useDockerDesktopClient();
  var [pullByVersion, setPullByVersion] = React.useState(false);
  
  const setImageState = (fullName: string, state: string) => {
      setImagesState((prevState: ImageState) => ({
        ...prevState,
        [fullName]: state,
      }));
  };

  const updateLocalStorage = (images?: Image[], toGroup?: boolean, toPullByVersion?: boolean, api_key?: string, organization?: string, repo?: string) => {
    var d;
    if (localStorage.hasOwnProperty(REGISTRY)) {
      d = JSON.parse(localStorage.getItem(REGISTRY) || '{}');
    } else {
      d = {
        'images': [], 'creds': {}, 'groupImages': false, 'pullByVersion': false
      };
    }
    if (images !== undefined) {
      d['images'] = images;
      setImages(d['images']);
    }
    if (toGroup !== undefined) {
      d['groupImages'] = toGroup;
      setGroupImages(d['groupImages']);
    }
    if (toPullByVersion !== undefined) {
      d['pullByVersion'] = toPullByVersion;
      setPullByVersion(d['pullByVersion']);
      pullByVersion = toPullByVersion;
    }
    if (api_key !== undefined) {
      d['creds']['api_key'] = api_key;
      setAPIKey(api_key);
    }
    if (organization !== undefined) {
      d['creds']['organization'] = organization;
      setOrg(organization);
    }
    if (repo !== undefined) {
      d['creds']['repo'] = repo;
      setRepo(repo);
    }
    localStorage.setItem(REGISTRY, JSON.stringify(d));
  }

  const updateLocalStorageAndImages = (images?: Image[], toGroup?: boolean, toPullByVersion?: boolean) => {
    updateLocalStorage(images, toGroup, toPullByVersion);
    updateImages();
  }

  const setCreds = (api_key: string, organization?: string, repo?: string) => {
    updateLocalStorage(undefined, undefined, undefined, api_key, organization, repo)
  }

  React.useEffect(() => {
    loadDockerImages().then((list) => {
      list.forEach((el) => {
        setImageState(el.replace("@", ":"), 'pulled');
      });
    });
  }, [images, value]);

  if (!imported) {
    setImported(true);
    if (!allImages.length) {
      importData().then((data) => {
        allImages = data.images;
        setImages(data.images);
        setGroupImages(data.groupImages);
        setPullByVersion(data.pullByVersion);
        setCreds(data.creds.api_key, data.creds.organization, data.creds.repo);
      });
    }
  }
  
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
  	setValue(newValue);
  };
  
  const updateImages = async () => {
    setImages([]);
    try {
      var ld = JSON.parse(localStorage.getItem(REGISTRY) || '');
      var d = ld.creds;
      d['group'] = ld.groupImages;
    } catch(_e) {
      d = {'api_key': '', 'organization': '', 'repo': '', "group": groupImages}
    }
    const result = await ddClient.extension.vm?.service?.get('/packages?creds=' + JSON.stringify(d))
    .then((data: any) => {
        var newImages = new Array();
        var uniqueImageTags = new Array();
        for (var img of data) {
          img.root = 'cloudsmith';
          img.architectures = img.architectures.map((item: {name: string}) => item.name);
          img.fullName = img.namespace + " / " + img.repository + " / " + img.display_name;
          img.publicAccess = false;
          img.pullName = 'docker.cloudsmith.io/' + img.namespace + "/" + img.repository + "/" + img.name;
          if (img.hasOwnProperty('pullTags')) {
            img.pullTags = img["pullTags"];
            var unqVersions: string[] = []
            for (var pt of img.pullTags) {
              pt.architectures = pt.architectures.map((item: {name: string}) => item.name);
              if (pt.tags.hasOwnProperty("version") && pt.tags.version.length > 0){
                if (!pullByVersion && !unqVersions.includes(pt.tags.version[0])) {
                  unqVersions.push(pt.tags.version[0]);
                  pt.tag = pt.tags.version[0];
                }
              }
              
            }
          } else {
            var ptag = {
              tag: "",
              architectures: img.architectures, 
              tags: img.tags, 
              type: img.type_display
            }
            if (!pullByVersion && img.tags.hasOwnProperty("version") && !uniqueImageTags.includes(img.name + ":" + img.tags['version'])) {
              uniqueImageTags.push(img.name + ":" + img.tags["version"]);
              ptag["tag"] = img.tags['version'];
            } else {
              ptag['tag'] = 'sha256:' + img.version;
            }
            img.pullTags = [ptag];
          }

          newImages.push(img);
        }
        setImages(newImages);
        updateLocalStorage(newImages);
    });
  };
  
  const pullImage = (image: string, tag: string) => {
    var fullName = `${image}:${tag}`;
    var pullName = fullName;
    if (tag.toString().startsWith('sha256')) {
      pullName = `${image}@${tag}`;
    }
    setImageState(fullName, 'pull');

    const progress: { [key: string]: string } = {};
    const statusCost: { [key: string]: number } = {
      'Pulling fs layer': 1,
      'Waiting': 2,
      'Verifying Checksum': 3,
      'Download complete': 4,
      'Already exists': 5,
      'Pull complete': 5,
    };
    const countProgress = () => {
      const all = Object.entries(progress).length * 5;
      const curr = Object.values(progress)
        .map((status) => statusCost[status] || 0)
        .reduce((a, b) => a + b, 0);
      return Math.ceil((curr / all) * 100);
    };

    ddClient?.docker.cli.exec('pull', [pullName], {
      stream: {
        onOutput(data) {
          const line = data.stdout || '';
          if (data.stderr) {
            ddClient.desktopUI.toast.error((`Error pulling docker image ${pullName}: ${data.stderr}`));
          }
          if (data.stdout && data.stdout.indexOf("Status:") !== -1) {
            ddClient.desktopUI.toast.success((`${data.stdout}`));
          }
          if (line.indexOf(':') === 12) {
            const [hash, status] = line.split(': ');
            progress[hash] = status;
            setImageState(fullName, 'pull:' + countProgress());
          }
        },
        onError(error) {
          console.error(error);
        },
        onClose(exitCode) {
          ddClient.desktopUI.toast.success(`Finished pulling image ${fullName}`);
          setImageState(fullName, 'pulled');
        },
        splitOutputLines: true,
      },
    });
  };
  
  const rmImage = (image: string, tag: string) => {
    const fullName = `${image}:${tag}`;
    setImageState(fullName, 'rm');
    var pullName = fullName;
    if (tag.toString().startsWith('sha256')) {
      pullName = `${image}@${tag}`;
    }
    ddClient?.docker.cli.exec('rmi', [pullName], {
      stream: {
        onOutput(data) { },
        onError(error) {
          console.error(error);
        },
        onClose(exitCode) {
          ddClient.desktopUI.toast.success(`Docker image ${fullName} deleted`);
          setImageState(fullName, 'notPulled');
        },
        splitOutputLines: true,
      },
    });
  };

  return (
    <>
		<AppBar position="fixed" color="transparent">
			<Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <img
            alt="Cloudsmith"
            src="cloudsmith-symbol.svg"
            height={'38px'}
          /> Cloudsmith
        </Typography>
        <Tooltip title="Sync with repository">
          <IconButton
            size="large"
            aria-label="sync"
            color="inherit"
            onClick={() => updateImages()}
          >
            <SyncIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Show help">
          <IconButton
            size="large"
            aria-label="help"
            color="inherit"
            onClick={() => setShowInfo(true)}
          >
            <QuestionMark />
          </IconButton>
        </Tooltip>
      </Toolbar>
		</AppBar>
    
    <br /><br /><br />

	  <Box>
      <Tabs value={value} onChange={handleChange}>
        <Tab label="Images" value={0} />
        <Tab label="Config" value={1} />
      </Tabs>
      <TabPanel value={value} index={0}>
        {!repository && images.length == 0 ? (
          <h2>
            Configure your API key, organization and repository in the Config tab and 
            then click the Synchronization button on the top right to get started.
          </h2>
        ) : (
          <Images
            images={images}
            imagesState={imagesState}
            root="cloudsmith"
            onPull={pullImage}
            onDelete={rmImage}
            onCopy={copyToClipboard}
          />
        )}
      </TabPanel>
      <TabPanel value={value} index={1}>
          <InputLabel htmlFor="standard-adornment-password">
              API Key
          </InputLabel>
          <br />
          <Input
            fullWidth
            margin="dense"
            id="api_key"
            type="text"
            value={apiKey}
            onChange={(e) => setCreds(e.target.value)}
          />

          <InputLabel htmlFor="standard-adornment-password">
              Organization / Repository
          </InputLabel>
          <br />
          <Input
            margin="dense"
            id="organization"
            type="text"
            value={organization}
            onChange={(e) => setCreds(apiKey, e.target.value)}
          />
          &nbsp; / &nbsp;
          <Input
            margin="dense"
            id="repository"
            type="text"
            value={repository}
            onChange={(e) => setCreds(apiKey, organization, e.target.value)}
          />
          <div style={{marginTop: "2em"}}>
            <Tooltip title="Group images by name">
              <FormControlLabel
                sx={{ alignSelf: 'flex-end' }}
                control={
                  <Switch
                    disabled={images.length > 0 ? false : true}
                    checked={groupImages}
                    onChange={(e) => updateLocalStorageAndImages(undefined, e.target.checked)}
                  />
                }
                label="Group images by name"
                labelPlacement="start"
              />
            </Tooltip>

            <Tooltip title="Pull by version always">
              <FormControlLabel
                sx={{ alignSelf: 'flex-end', marginLeft: "1em" }}
                control={
                  <Switch
                    disabled={images.length > 0 ? false : true}
                    checked={pullByVersion}
                    onChange={(e) => updateLocalStorageAndImages(undefined, undefined, e.target.checked)}
                  />
                }
                label="Only pull by digest"
                labelPlacement="start"
              />
            </Tooltip>
          </div>
      </TabPanel>
	  </Box>
    <Info open={showInfo} onClose={() => setShowInfo(false)} />
    </>
  );
}
