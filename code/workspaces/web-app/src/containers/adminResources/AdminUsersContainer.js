import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';
import { useUsers } from '../../hooks/usersHooks';
import { useOtherUserRoles } from '../../hooks/otherUserRolesHooks';
import UserMultiSelect from './UserMultiSelect';
import userActions from '../../actions/userActions';
import sortByName from './sortByName';
import otherUserRolesActions from '../../actions/otherUserRolesActions';
import filterUserByRoles from './filterUserByRoles';

import UserResources from './UserResources';
import PromisedContentWrapper from '../../components/common/PromisedContentWrapper';
import Pagination from '../../components/stacks/Pagination';

const useStyles = makeStyles(theme => ({
  filterControls: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  filterColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  filterText: {
    fontWeight: '400',
    marginRight: theme.spacing(4),
    paddingTop: theme.spacing(2),
  },
  placeholderCard: {
    width: '100%',
    height: 70,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

function AdminUsersContainer({ userPermissions }) {
  const dispatch = useDispatch();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filters, setFilters] = useState({
    instanceAdmin: false,
    projectAdmin: false,
    projectUser: false,
    projectViewer: false,
    siteOwner: false,
    notebookOwner: false,
    storageAccess: false,
  });
  const classes = useStyles();
  const users = useUsers();
  const otherUserRoles = useOtherUserRoles();

  // get list of users
  useEffect(() => {
    dispatch(userActions.listUsers());
  }, [dispatch]);

  // get roles for users
  useEffect(() => {
    sortByName(users.value).forEach(user => dispatch(otherUserRolesActions.getOtherUserRoles(user.userId)));
  }, [dispatch, users.value]);

  // the users before applying the checkbox filters
  const preFilteredUsers = (selectedUsers && selectedUsers.length > 0) ? selectedUsers : sortByName(users.value);
  console.log(`otherUserRoles.value ${JSON.stringify(otherUserRoles.value)}`);

  // the users after applying the checkbox filters
  const filteredUsers = preFilteredUsers.filter(user => filterUserByRoles(user.userId, filters, otherUserRoles.value));
  console.log(`filteredUsers ${JSON.stringify(filteredUsers)}`);

  const renderedUsers = filteredUsers && filteredUsers.length > 0
    ? filteredUsers.map(user => <UserResources userPermissions={userPermissions} user={user} filters={filters} roles={otherUserRoles.value[user.userId]} />)
    : [<div className={classes.placeholderCard} key={'placeholder-card'}>
      <Typography variant="body1">No users to display.</Typography>
    </div>];

  const handleCheckboxChange = (event) => {
    setFilters({ ...filters, [event.target.name]: event.target.checked });
  };

  return (
    <>
      <UserMultiSelect selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} />
      <div className={classes.filterControls}>
        <div className={classes.filterColumn}>
          <span className={classes.filterText}>Filter</span>
        </div>
        <div className={classes.filterColumn}>
          <FormControlLabel label="Instance admin" control={
            <Checkbox checked={filters.instanceAdmin} onChange={handleCheckboxChange} name="instanceAdmin" color="primary" />
          } />
        </div>
        <div className={classes.filterColumn}>
          <FormControlLabel label="Project admin" control={
            <Checkbox checked={filters.projectAdmin} onChange={handleCheckboxChange} name="projectAdmin" color="primary" />
          } />
          <FormControlLabel label="Project user" control={
            <Checkbox checked={filters.projectUser} onChange={handleCheckboxChange} name="projectUser" color="primary" />
          } />
          <FormControlLabel label="Project viewer" control={
            <Checkbox checked={filters.projectViewer} onChange={handleCheckboxChange} name="projectViewer" color="primary" />
          } />
        </div>
        <div className={classes.filterColumn}>
          <FormControlLabel label="Site owner" control={
            <Checkbox checked={filters.siteOwner} onChange={handleCheckboxChange} name="siteOwner" color="primary" />
          } />
          <FormControlLabel label="Notebook owner" control={
            <Checkbox checked={filters.notebookOwner} onChange={handleCheckboxChange} name="notebookOwner" color="primary" />
          } />
          <FormControlLabel label="Storage access" control={
            <Checkbox checked={filters.storageAccess} onChange={handleCheckboxChange} name="storageAccess" color="primary" />
          } />
        </div>
      </div>
      <div>
        <PromisedContentWrapper fetchingClassName={classes.placeholderCard} promise={otherUserRoles}>
          <Pagination items={renderedUsers} itemsPerPage={5} itemsName="Users" />
        </PromisedContentWrapper>
      </div>
    </>
  );
}

export default AdminUsersContainer;
