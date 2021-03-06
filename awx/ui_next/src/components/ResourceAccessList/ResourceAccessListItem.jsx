import 'styled-components/macro';
import React from 'react';
import { func } from 'prop-types';
import { t } from '@lingui/macro';
import { Chip } from '@patternfly/react-core';
import { Tr, Td } from '@patternfly/react-table';
import { Link } from 'react-router-dom';

import ChipGroup from '../ChipGroup';
import { DetailList, Detail } from '../DetailList';
import { AccessRecord } from '../../types';

function ResourceAccessListItem({ accessRecord, onRoleDelete }) {
  ResourceAccessListItem.propTypes = {
    accessRecord: AccessRecord.isRequired,
    onRoleDelete: func.isRequired,
  };

  const getRoleLists = () => {
    const teamRoles = [];
    const userRoles = [];

    function sort(item) {
      const { role } = item;
      if (role.team_id) {
        teamRoles.push(role);
      } else {
        userRoles.push(role);
      }
    }

    accessRecord.summary_fields.direct_access.map(sort);
    accessRecord.summary_fields.indirect_access.map(sort);
    return [teamRoles, userRoles];
  };

  const renderChip = role => {
    return (
      <Chip
        key={role.id}
        onClick={() => {
          onRoleDelete(role, accessRecord);
        }}
        isReadOnly={!role.user_capabilities.unattach}
        ouiaId={`${role.name}-${role.id}`}
        closeBtnAriaLabel={t`Remove ${role.name} chip`}
      >
        {role.name}
      </Chip>
    );
  };

  const [teamRoles, userRoles] = getRoleLists();

  return (
    <Tr id={`access-item-row-${accessRecord.id}`}>
      <Td id={`access-record-${accessRecord.id}`} dataLabel={t`Name`}>
        {accessRecord.id ? (
          <Link to={{ pathname: `/users/${accessRecord.id}/details` }}>
            {accessRecord.username}
          </Link>
        ) : (
          accessRecord.username
        )}
      </Td>
      <Td dataLabel={t`First name`}>{accessRecord.first_name}</Td>
      <Td dataLabel={t`Last name`}>{accessRecord.first_name}</Td>
      <Td dataLabel={t`Roles`}>
        <DetailList stacked>
          {userRoles.length > 0 && (
            <Detail
              label={t`User Roles`}
              value={
                <ChipGroup numChips={5} totalChips={userRoles.length}>
                  {userRoles.map(renderChip)}
                </ChipGroup>
              }
            />
          )}
          {teamRoles.length > 0 && (
            <Detail
              label={t`Team Roles`}
              value={
                <ChipGroup numChips={5} totalChips={teamRoles.length}>
                  {teamRoles.map(renderChip)}
                </ChipGroup>
              }
            />
          )}
        </DetailList>
      </Td>
    </Tr>
  );
}

export default ResourceAccessListItem;
