import * as React from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Box } from '@mui/system';
import FormControl from '@mui/material/FormControl';
import Tooltip from '@mui/material/Tooltip';
import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import Storage from '@mui/icons-material/Storage';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import { TextField, Link, Grid, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';

export interface ImageState {
  [key: string]: string;
}

interface ImagesProps {
  images: Image[];
  imagesState: ImageState;
  root: string;
  onPull: ((image: string, tag: string) => void) | null;
  onDelete: ((image: string, tag: string) => void) | null;
  onCopy: ((value: string) => void) | null;
}

export interface ImageTags {
  [key: string]: string[];
}

interface PullTag {
  tag: string;
  architectures: string[];
  tags: ImageTags;
  type: string;
}

export interface Image {
  repository: string;
  root: string;
  name: string;
  fullName: string;
  pullName: string;
  architectures: string[];
  tags: ImageTags;
  publicAccess: boolean;
  version: string;
  pullTags: PullTag[];
  
  [key: string]: any;
}

interface StyledSearchProps {
  whichFilter: string;
  placeholder: string;
  filterFunc: (name: string) => void;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    transition: 'all 0.3s',
    '&:hover': {
      boxShadow: `0 0 10px ${theme.palette.primary.main}`,
    },
    '&.Mui-focused': {
      boxShadow: `0 0 15px ${theme.palette.primary.main}`,
    },
  },
}));

const StyledSearch: React.FC<StyledSearchProps> = ({ whichFilter, filterFunc, placeholder }) => {
  const handleClear = () => {
    filterFunc('');
  };

  return (
    <Box display="flex" alignItems="center">
      <StyledTextField
        variant="outlined"
        placeholder={placeholder}
        value={whichFilter}
        onChange={(e) => filterFunc(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {whichFilter ? (
                <IconButton onClick={handleClear} size="small">
                  <ClearOutlinedIcon />
                </IconButton>
              ) : (
                <SearchOutlinedIcon />
              )}
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

const cloudsmithTag = (tag: string) => {
  var t = tag;
  if (tag.length >= 15) {
    t = tag.slice(0, 12) + '...';
  }
  return (
    <>
      <b>{t}</b>
    </>
  );
}

export function Images(props: ImagesProps) {
  const { images, imagesState, root } = props;
  const [filterName, setFilterName] = React.useState('');
  const [filterTag, setFilterTag] = React.useState('');
  const [seeMore, setSeeMore] = React.useState<{ [key: string]: boolean }>({});

  const filterImages = (images: Image[]) => {
    const result = images
      .filter((repo) => root && root === repo.root)
      .filter((repo) => !filterName || (repo.version + " : " + repo.fullName).includes(filterName))
      .filter((repo) => !filterTag || (Object.values(repo.tags).flat().includes(filterTag)))
      .map((repo) => ({
        ...repo,
        shaPull: !repo.tags.hasOwnProperty('version'),
        tags: repo.tags.hasOwnProperty("info") ? repo.tags['info'] : [],
      }));
    return result;
  };

  const isLocal = (fullName: string, tag: string) => {
    const imageState = imagesState[`${fullName}:${tag}`] || '';
    const [name, _] = imageState.split(':');
    if (name == "pulled") {
      return (
        <Tooltip title="This image has been pulled from your Cloudsmith repository">
          <Storage />
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title="Remote in your Cloudsmith repository">
          <CloudOutlinedIcon />
        </Tooltip>
      )
    }
  };

  const action = (fullName: string, tag: string) => {
    const imageState = imagesState[`${fullName}:${tag}`] || 'notPulled';
    const [name, value] = imageState.split(':');
    switch (name) {
      case 'pulled':
        return (
          <Tooltip title="Delete image from local">
            <IconButton 
              size="small"
              color="error"
              onClick={() => props.onDelete && props.onDelete(fullName, tag)}
            >
              <DeleteIcon/>
            </IconButton>
          </Tooltip>
        );

      case 'rm':
      case 'pull':
        return (
          <Button size="small" disabled={true} variant="contained">
            <CircularProgress
              color="inherit"
              size={16}
              variant={value ? 'determinate' : 'indeterminate'}
              value={parseInt(value, 10)}
            />
            &nbsp;{value ? `${value}%` : ''}
          </Button>
        );

      case 'notPulled':
        return (
          <Tooltip title="Pull image">
            <IconButton 
              size="small"
              onClick={() => props.onPull && props.onPull(fullName, tag)}
            >
              <CloudDownloadOutlinedIcon/>
            </IconButton>
          </Tooltip>
        );
      default:
        return <></>;
    }
  };

  return (
    <Box>
      <Box sx={{marginTop: "1em", marginBottom: "1em"}}>
        <FormControl
          sx={{ minWidth: '30ch' }}
          variant="standard"
        >
          <StyledSearch whichFilter={filterName} filterFunc={setFilterName} placeholder="Search by name" />
        </FormControl>
        <FormControl
          sx={{ minWidth: '30ch', marginLeft: "2em" }}
          variant="standard"
        >
          <StyledSearch whichFilter={filterTag} filterFunc={setFilterTag} placeholder="Search tags" />
        </FormControl>
      </Box>
      <TableContainer
        sx={{
          maxHeight: 'calc(100vh - 186px)',
        }}
      >
        <Table
          stickyHeader
          size="small"
          padding="normal"
          sx={{ whiteSpace: 'nowrap' }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Pull</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          {filterImages(images).map((image) => (
            <TableBody key={image.version + " : " + image.fullName}>
              {image.pullTags.map((tag, ind) =>
                !seeMore[image.fullName] && ind > 2 ? null : (
                  <TableRow
                    hover
                    key={`${image.pullName}:${tag.tag}`}
                    sx={{
                      '&:not(:last-child) td': { border: 0 },
                    }}
                  >
                    <TableCell>
                      {ind === 0 && (
                        <Grid
                          container
                          direction="row"
                          alignItems="center"
                          spacing={4}
                          sx={{
                            flexWrap: 'nowrap',
                          }}
                        >
                          <Grid item>
                            {isLocal(image.pullName, tag.tag)}
                          </Grid>
                          <Grid item>
                            <b>{image.fullName}</b>
                            <br />
                            <i>{image.version.length >= 64 ? (image.version.slice(0, 8) + '...' + image.version.slice(-8)) : image.version}</i>
                          </Grid>
                        </Grid>
                      )}
                    </TableCell>
                    <TableCell>
                      <Grid item sx={{whiteSpace: "pre-line"}}>
                        <i>{tag.type}</i>
                        <br />
                        Architectures: {tag.architectures.join(', ')}
                        <br />
                        Tags: {Object.values(tag.tags).flat().map((v, i) => v + (((i + 1) % 10 === 0) ? '\n' : ', ')).join('').trim().replace(/,\s*$/, '').trim()}
                      </Grid>
                    </TableCell>
                    <TableCell
                      sx={{
                        '&:hover .hover-btn': {
                          visibility: 'visible',
                        },
                      }}
                    >
                      {cloudsmithTag(tag.tag)}
                      {props.onCopy && (
                        <Tooltip title="Copy image name with tag to clipboard">
                          <IconButton
                            className="hover-btn"
                            sx={{ visibility: 'hidden' }}
                            onClick={() =>
                              props.onCopy &&
                              props.onCopy(`${image.pullName}${tag.tag.indexOf("sha256") !== -1 ? ("@") : (":")}${tag.tag}`)
                            }
                          >
                            <ContentCopyOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {action(image.pullName, tag.tag)}
                    </TableCell>
                  </TableRow>
                ),
              )}
              {!seeMore[image.fullName] && image.pullTags.length > 3 && (
                <TableRow
                  sx={{
                    '&:not(:nth-of-type(n+4))': { display: 'none' },
                  }}
                >
                  <TableCell />
                  <TableCell colSpan={2}>
                    <Link
                      variant="body1"
                      href="#"
                      underline="none"
                      onClick={() =>
                        setSeeMore({ ...seeMore, [image.fullName]: true })
                      }
                    >
                      <b>See more</b>
                    </Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          ))}
        </Table>
      </TableContainer>
    </Box>
  );
}