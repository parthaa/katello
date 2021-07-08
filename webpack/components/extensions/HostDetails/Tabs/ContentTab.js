import React, { useEffect, useState } from 'react';
import RoutedTabs from '../../../../components/RoutedTabs';
import EmptyPage from 'foremanReact/components/common/EmptyState/EmptyStatePattern';
import { selectRouterLocation, selectRouterHash, selectRouterPath } from 'foremanReact/routes/RouterSelector';
import { useSelector } from 'react-redux';
import {  useParams } from "react-router-dom";
import { Tabs, Tab, TabTitleText} from '@patternfly/react-core';


const ContentTab = () => {
  const [activeTab, setActiveTab] = useState('Content');
  const tabs = [
    {
      key: 'packages',
      title: __('Packages'),
      content:  <EmptyPage
                  icon="enterprise"
                  header="WIP Packages"
                  description="This is a demo for adding content to the new host details page"
                />,
    },
    {
      key: 'errata',
      title: __('Errata'),
      content:  <EmptyPage
                  icon="enterprise"
                  header="WIP Errata"
                  description="This is a demo for adding content to the new host details page"
                />,
    },
    {
      key: 'modulestreams',
      title: __('Module Streams'),
      content:  <EmptyPage
                  icon="enterprise"
                  header="WIP Module Streams"
                  description="This is a demo for module streams on new host details page"
                />,
    },
  ];

  const handleTabClick = (event, tabIndex) => {
    setActiveTab(tabIndex);
  };

  useEffect(() => {
    setActiveTab(tabs[0].key)
  }, []);

  return  (<Tabs isSecondary
            activeKey={activeTab}
            onSelect={handleTabClick}>

          { tabs.map(tab => (
              <Tab eventKey={tab.key} title={<TabTitleText>{tab.title}</TabTitleText>}>
                {tab.content}
              </Tab>
            ))
          }
        </Tabs>
        )
};

export default ContentTab;
