import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { TableOfContents } from './TableOfContents';
import { EnhancedTableOfContents } from './EnhancedTableOfContents';
import './TocDemo.css';

interface TocDemoProps {
  editor: Editor | null;
}

export const TocDemo = ({ editor }: TocDemoProps) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'enhanced'>('enhanced');
  const [enhancedOptions, setEnhancedOptions] = useState({
    collapsible: true,
    showNumbers: false,
    maxLevel: 6,
  });

  const handleTocItemClick = (position: number) => {
    console.log('跳转到位置:', position);
  };

  return (
    <div className="toc-demo">
      <div className="toc-demo-header">
        <div className="toc-demo-tabs">
          <button
            className={`toc-demo-tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            基础目录
          </button>
          <button
            className={`toc-demo-tab ${activeTab === 'enhanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('enhanced')}
          >
            增强目录
          </button>
        </div>

        {activeTab === 'enhanced' && (
          <div className="toc-demo-options">
            <label className="toc-demo-option">
              <input
                type="checkbox"
                checked={enhancedOptions.collapsible}
                onChange={(e) =>
                  setEnhancedOptions(prev => ({
                    ...prev,
                    collapsible: e.target.checked
                  }))
                }
              />
              可折叠
            </label>

            <label className="toc-demo-option">
              <input
                type="checkbox"
                checked={enhancedOptions.showNumbers}
                onChange={(e) =>
                  setEnhancedOptions(prev => ({
                    ...prev,
                    showNumbers: e.target.checked
                  }))
                }
              />
              显示编号
            </label>

            <label className="toc-demo-option">
              <span>最大层级:</span>
              <select
                value={enhancedOptions.maxLevel}
                onChange={(e) =>
                  setEnhancedOptions(prev => ({
                    ...prev,
                    maxLevel: parseInt(e.target.value)
                  }))
                }
              >
                <option value={3}>H1-H3</option>
                <option value={4}>H1-H4</option>
                <option value={5}>H1-H5</option>
                <option value={6}>H1-H6</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="toc-demo-content">
        {activeTab === 'basic' ? (
          <TableOfContents
            editor={editor}
            onItemClick={handleTocItemClick}
          />
        ) : (
          <EnhancedTableOfContents
            editor={editor}
            onItemClick={handleTocItemClick}
            collapsible={enhancedOptions.collapsible}
            showNumbers={enhancedOptions.showNumbers}
            maxLevel={enhancedOptions.maxLevel}
          />
        )}
      </div>

      <div className="toc-demo-info">
        <h4>功能说明</h4>
        {activeTab === 'basic' ? (
          <ul>
            <li>自动提取文档中的标题</li>
            <li>点击标题跳转到对应位置</li>
            <li>实时高亮当前编辑位置</li>
            <li>响应式设计</li>
          </ul>
        ) : (
          <ul>
            <li>层级结构显示</li>
            <li>支持折叠/展开子级</li>
            <li>搜索功能</li>
            <li>可选编号显示</li>
            <li>可配置最大层级</li>
            <li>丰富的交互动画</li>
          </ul>
        )}
      </div>
    </div>
  );
};
