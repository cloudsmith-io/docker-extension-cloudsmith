import Modal, { ModalProps } from '@mui/material/Modal';
import Link, { LinkProps } from '@mui/material/Link';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { copyToClipboard, openExternal } from './App';
import IconButton from '@mui/material/IconButton';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80vw',
  maxHeight: '80vh',
  overflow: 'auto',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const styleBlock = {
  marginBottom: '1em',
};

const styleParagraph = {
  marginBottom: '1em',
};

function CodeBlock(props: { code: string }) {
  const { code } = props;
  return (
    <Typography
      sx={{
        position: 'relative',
        paddingLeft: '1em',
        border: '1px solid gray',
        '&:hover button': {
          visibility: 'visible',
        },
      }}
      onClick={() => copyToClipboard(code, false)}
    >
      <pre>{code.trim()}</pre>
      <Tooltip
        title="Copy"
        sx={{
          visibility: 'hidden',
          position: 'absolute',
          right: '.5em',
          top: '.5em',
        }}
      >
        <IconButton>
          <ContentCopyOutlinedIcon />
        </IconButton>
      </Tooltip>
    </Typography>
  );
}

function ExternalLink(props: LinkProps & { href: string }) {
  return (
    <Link
      style={{ cursor: 'pointer' }}
      onClick={() => openExternal(props.href)}
    >
      {props.children || props.href}
    </Link>
  );
}

const loginExample = (domain: string) => String.raw`
docker login ${domain}
Username: <ORGANIZATION>/<REPOSITORY>
Password: <TOKEN>
`;

export function Info(props: Omit<ModalProps, 'children'>) {
  const modalProps = props;
  return (
    <Modal
      {...modalProps}
      aria-labelledby="docker-modal-title"
      aria-describedby="docker-modal-description"
    >
      <Box sx={style}>
        <Box sx={styleBlock}>
          <Typography variant="h4">Docker Extension Setup</Typography>
          <Typography sx={styleParagraph}>
            A fully-fledged Docker registry.
          </Typography>
          <Typography sx={styleParagraph}>
            Set your API key, Organization and Repository under the Configuration tab. Then, click the Synchronization
            button in the top right of the extension to get the images contained in your repository.
          </Typography>
        </Box>
        
        <Box sx={styleBlock}>
          <Typography variant="h4">Pulling Images</Typography>
          <Typography sx={styleParagraph}>
            Pulling (downloading) an image from the Cloudsmith Docker registry can be done using the 
            Pull button to the right of the image name after synchronzing with a repository. You can 
            also use the standard Docker pull command on your desired image and tag, which is availabe
            to be copied by hovering over them and clicking the copy icon and will take the form of:
          </Typography>
          <Typography sx={styleParagraph}>
            <code>docker pull docker.cloudsmith.io/organization/repository/your-image:latest</code>
            <br />
            Where <code>your-image</code> and <code>latest</code> are replaced with your own image name and tag.
          </Typography>
        </Box>

        <Box sx={styleBlock}>
          <Typography variant="h4">Authentication</Typography>
          <Typography sx={styleParagraph}>
            If your registry is private, you'll need to authenticate to pull images. You can find details for 
            authenticating under the Set Me Up instructions for Docker in your Cloudsmith repository. 
            When authenticating with an entitlement token this takes the form of:
          </Typography>
          <CodeBlock code={loginExample("docker.cloudsmith.io")} />
        </Box>

        <Box sx={styleBlock}>
          <Typography variant="h4">Need Help?</Typography>
          <Typography sx={styleParagraph}>
            For additional documentation on the Cloudsmith Docker registry, please refer to our help documentation at <ExternalLink href="https://help.cloudsmith.io/docs/docker-registry" />.
          </Typography>
          <Typography sx={styleParagraph}>
            If you couldn't find what you needed in our documentation, you can always chat with our team. It's our mission to be your dedicated off-site team for package management.
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
}
