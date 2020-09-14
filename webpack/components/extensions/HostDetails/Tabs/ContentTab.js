import React from 'react';
import { Tabs, Tab, TabTitleText} from '@patternfly/react-core';

const ContentTab = () => (
  <Tabs>
    <Tab title={<TabTitleText>Packages</TabTitleText>}>
      Packages
    </Tab>
    <Tab title={<TabTitleText>Errata</TabTitleText>}>
      Errata
    </Tab>
    <Tab title={<TabTitleText>Module Streams</TabTitleText>}>
      Module Streams
    </Tab>
  </Tabs>
);

export default ContentTab;
