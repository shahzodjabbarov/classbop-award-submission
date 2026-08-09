import { useMemo, useRef, useState } from 'react';
import MenuCard from '../components/MenuCard';
import MenuHeading from '../components/MenuHeading';
import { useI18n } from '../i18n/useI18n';
import './Tools.css';

const ACCEPTED_UPLOADS = [
  'image/*',
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
].join(',');

const LEVELS = ['Elementary', 'Middle school', 'High school', 'Adult'];
const DIFFICULTIES = ['Easy', 'Balanced', 'Challenging'];
const OUTPUT_FORMATS = ['PDF', 'DOCX', 'Google Doc', 'Slides'];

const TOOL_CONFIG = {
  quiz: {
    id: 'quiz',
    eyebrow: 'Quiz Maker',
    title: 'Quiz Maker',
    shortTitle: 'Quiz',
    summary: 'Generate classroom quizzes from lesson text, images, and PDFs.',
    accent: '#F5B400',
    softAccent: '#FEF3C7',
    menuTags: ['AI-assisted', 'Images', 'Playable'],
    image: '/thumbnails/quiz_maker.jpg',
  },
  homework: {
    id: 'homework',
    eyebrow: 'Homework Maker',
    title: 'Homework Maker',
    shortTitle: 'Homework',
    summary: 'Turn classroom material into polished take-home practice.',
    accent: '#2563EB',
    softAccent: '#D7F7EF',
    action: 'Generate Homework',
    resultTitle: 'Homework Packet',
    resultMeta: 'Student copy, answer key, and teacher notes',
    amountLabel: 'Questions',
    amountOptions: ['8', '12', '16', '24'],
    modeLabel: 'Assignment Type',
    modes: ['Worksheet', 'Review Packet', 'Vocabulary Practice', 'Reading Check'],
    extras: ['Answer Key', 'Teacher Notes', 'Rubric', 'Parent Note'],
    previewSections: ['Warm-up', 'Guided practice', 'Independent practice', 'Exit check'],
    menuTags: ['Printable', 'Upload', 'No prep'],
    image: '/thumbnails/homework_maker.jpg',
  },
  test: {
    id: 'test',
    eyebrow: 'Test Maker',
    title: 'Test Maker',
    shortTitle: 'Test',
    summary: 'Build clean assessments from images, PDFs, and lesson files.',
    accent: '#EF1D2B',
    softAccent: '#E4E7FF',
    action: 'Generate Test',
    resultTitle: 'Assessment Draft',
    resultMeta: 'Printable test, scoring guide, and answer sheet',
    amountLabel: 'Items',
    amountOptions: ['10', '20', '30', '40'],
    modeLabel: 'Assessment Type',
    modes: ['Quiz', 'Unit Test', 'Mock Exam', 'Placement Check'],
    extras: ['Answer Key', 'Point Values', 'Student Version', 'Retake Version'],
    previewSections: ['Multiple choice', 'Short answer', 'Application task', 'Scoring guide'],
    menuTags: ['Assessment', 'Answer key', 'PDF'],
    image: '/thumbnails/test_maker.jpg',
  },
};

const DEFAULT_OPTIONS = {
  homework: {
    title: '',
    level: 'Elementary',
    subject: 'English',
    language: 'English',
    difficulty: 'Balanced',
    amount: '12',
    mode: 'Worksheet',
    output: 'PDF',
    extras: ['Answer Key', 'Teacher Notes'],
  },
  test: {
    title: '',
    level: 'Middle school',
    subject: 'English',
    language: 'English',
    difficulty: 'Balanced',
    amount: '20',
    mode: 'Quiz',
    output: 'PDF',
    extras: ['Answer Key', 'Point Values', 'Student Version'],
  },
};

const INITIAL_FILES = {
  homework: [],
  test: [],
};

const makeFileId = (file) => (
  `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`
);

const formatFileSize = (size) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileKind = (file) => {
  if (file.type.startsWith('image/')) return 'Image';
  if (file.type.includes('pdf')) return 'PDF';
  if (file.type.includes('presentation') || file.name.match(/\.(ppt|pptx)$/i)) return 'Slides';
  if (file.type.includes('word') || file.name.match(/\.(doc|docx)$/i)) return 'Doc';
  if (file.type.includes('text') || file.name.match(/\.(txt|csv)$/i)) return 'Text';
  return 'File';
};

export default function Tools() {
  const { t } = useI18n();
  const [activeToolId, setActiveToolId] = useState(null);
  const [filesByTool, setFilesByTool] = useState(INITIAL_FILES);
  const [optionsByTool, setOptionsByTool] = useState(DEFAULT_OPTIONS);
  const [draggingToolId, setDraggingToolId] = useState(null);
  const [generatedByTool, setGeneratedByTool] = useState({ homework: false, test: false });

  const selectedToolId = activeToolId || 'homework';
  const activeTool = TOOL_CONFIG[selectedToolId];
  const activeFiles = filesByTool[selectedToolId];
  const activeOptions = optionsByTool[selectedToolId];

  const fileSummary = useMemo(() => {
    const totalSize = activeFiles.reduce((sum, item) => sum + item.size, 0);
    return {
      count: activeFiles.length,
      size: totalSize ? formatFileSize(totalSize) : '0 KB',
    };
  }, [activeFiles]);

  const addFiles = (toolId, fileList) => {
    const incomingFiles = Array.from(fileList || []);
    if (!incomingFiles.length) return;

    const nextFiles = incomingFiles.map((file) => ({
      id: makeFileId(file),
      file,
      name: file.name,
      size: file.size,
      kind: getFileKind(file),
    }));

    setFilesByTool((current) => ({
      ...current,
      [toolId]: [...current[toolId], ...nextFiles],
    }));
    setGeneratedByTool((current) => ({ ...current, [toolId]: false }));
  };

  const removeFile = (toolId, fileId) => {
    setFilesByTool((current) => ({
      ...current,
      [toolId]: current[toolId].filter((item) => item.id !== fileId),
    }));
    setGeneratedByTool((current) => ({ ...current, [toolId]: false }));
  };

  const clearFiles = (toolId) => {
    setFilesByTool((current) => ({ ...current, [toolId]: [] }));
    setGeneratedByTool((current) => ({ ...current, [toolId]: false }));
  };

  const updateOption = (name, value) => {
    setOptionsByTool((current) => ({
      ...current,
      [selectedToolId]: {
        ...current[selectedToolId],
        [name]: value,
      },
    }));
    setGeneratedByTool((current) => ({ ...current, [selectedToolId]: false }));
  };

  const toggleExtra = (extra) => {
    const extras = activeOptions.extras.includes(extra)
      ? activeOptions.extras.filter((item) => item !== extra)
      : [...activeOptions.extras, extra];

    updateOption('extras', extras);
  };

  const handleGenerate = () => {
    setGeneratedByTool((current) => ({ ...current, [selectedToolId]: true }));
  };

  return (
    <section className={`tools-page ${activeToolId ? 'is-workbench-open' : 'is-menu'}`} aria-labelledby="tools-title">
      {!activeToolId ? (
        <ToolsMenu />
      ) : (
        <section
          className="tool-workbench"
          aria-labelledby={`${activeToolId}-workbench-title`}
          style={{ '--tool-accent': activeTool.accent, '--tool-soft': activeTool.softAccent }}
        >
          <div className="tool-workbench-titlebar">
            <div>
              <button className="tool-back-button" type="button" onClick={() => setActiveToolId(null)}>
                {t('tools.back')}
              </button>
              <p className="tools-kicker">{t(`tools.toolConfig.${activeTool.id}.eyebrow`)}</p>
              <h2 id={`${activeToolId}-workbench-title`}>{t(`tools.toolConfig.${activeTool.id}.title`)}</h2>
            </div>
            <div className="tool-workbench-summary">
              <span>{t('tools.sourceSummary', { count: fileSummary.count })}</span>
              <span>{fileSummary.size}</span>
              <span>{t(`tools.outputs.${activeOptions.output}`)}</span>
            </div>
          </div>

          <div className="tool-workbench-grid">
            <UploadPanel
              activeFiles={activeFiles}
              activeTool={activeTool}
              addFiles={addFiles}
              clearFiles={clearFiles}
              draggingToolId={draggingToolId}
              removeFile={removeFile}
              setDraggingToolId={setDraggingToolId}
            />

            <SettingsPanel
              activeOptions={activeOptions}
              activeTool={activeTool}
              handleGenerate={handleGenerate}
              toggleExtra={toggleExtra}
              updateOption={updateOption}
            />

            <PreviewPanel
              activeFiles={activeFiles}
              activeOptions={activeOptions}
              activeTool={activeTool}
              generated={generatedByTool[selectedToolId]}
            />
          </div>
        </section>
      )}
    </section>
  );
}

function ToolsMenu() {
  const { t } = useI18n();

  return (
    <div className="tools-menu bop-menu" aria-labelledby="tools-title">
      <MenuHeading id="tools-title" title={t('tools.menuTitle')} subtitle={t('tools.comingSoonNote')} />

      <div className="tools-menu-grid" aria-label={t('tools.menuLabel')}>
        {Object.values(TOOL_CONFIG).map((tool) => {
          const tags = tool.menuTags.map((tag) => t(`tools.toolConfig.${tool.id}.menuTags.${tag}`));
          return (
            <MenuCard
              key={tool.id}
              disabled
              badge={t('tools.comingSoon')}
              title={t(`tools.toolConfig.${tool.id}.title`)}
              description={t(`tools.toolConfig.${tool.id}.summary`)}
              meta={tags.slice(0, 2).join(' · ')}
              image={tool.image}
              accent={tool.accent}
              ariaLabel={t(`tools.toolConfig.${tool.id}.title`)}
            />
          );
        })}
      </div>
    </div>
  );
}

function UploadPanel({
  activeFiles,
  activeTool,
  addFiles,
  clearFiles,
  draggingToolId,
  removeFile,
  setDraggingToolId,
}) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const isDragging = draggingToolId === activeTool.id;

  const handleDrop = (event) => {
    event.preventDefault();
    setDraggingToolId(null);
    addFiles(activeTool.id, event.dataTransfer.files);
  };

  return (
    <div className="tool-panel tool-panel-upload">
      <div className="tool-panel-heading">
        <span className="tool-panel-step">01</span>
        <div>
          <h3>{t('tools.sourceUploads')}</h3>
          <p>{t('tools.sourceHelp')}</p>
        </div>
      </div>

      <div
        className={`upload-zone ${isDragging ? 'is-dragging' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDraggingToolId(activeTool.id);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDraggingToolId(null)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          className="upload-input"
          type="file"
          accept={ACCEPTED_UPLOADS}
          multiple
          tabIndex={-1}
          onChange={(event) => {
            addFiles(activeTool.id, event.target.files);
            event.target.value = '';
          }}
        />
        <div className="upload-mark" aria-hidden="true">+</div>
        <strong>{t('tools.dropFiles')}</strong>
        <span>{t('tools.selectFiles')}</span>
        <button className="tool-button tool-button-light" type="button" onClick={() => inputRef.current?.click()}>
          <span aria-hidden="true">+</span>
          {t('tools.browseFiles')}
        </button>
      </div>

      <div className="file-list-header">
        <span>{activeFiles.length ? t('tools.uploadedSources') : t('tools.noSources')}</span>
        {activeFiles.length > 0 && (
          <button type="button" onClick={() => clearFiles(activeTool.id)}>
            {t('tools.clear')}
          </button>
        )}
      </div>

      <div className="file-list" aria-live="polite">
        {activeFiles.length === 0 ? (
          <div className="empty-source">
            {t('tools.emptySources')}
          </div>
        ) : (
          activeFiles.map((item) => (
            <div className="file-row" key={item.id}>
              <span className="file-kind">{t(`tools.fileKinds.${item.kind}`)}</span>
              <span className="file-details">
                <strong>{item.name}</strong>
                <small>{formatFileSize(item.size)}</small>
              </span>
              <button
                className="file-remove"
                type="button"
                aria-label={t('tools.removeFile', { name: item.name })}
                onClick={() => removeFile(activeTool.id, item.id)}
              >
                x
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SettingsPanel({
  activeOptions,
  activeTool,
  handleGenerate,
  toggleExtra,
  updateOption,
}) {
  const { t } = useI18n();
  const modeLabel = t(`tools.toolConfig.${activeTool.id}.modeLabel`);

  return (
    <div className="tool-panel tool-panel-settings">
      <div className="tool-panel-heading">
        <span className="tool-panel-step">02</span>
        <div>
          <h3>{t('tools.buildSettings')}</h3>
          <p>{t('tools.settingsHelp', { modeLabel })}</p>
        </div>
      </div>

      <label className="field-stack">
        <span>{t('tools.materialTitle')}</span>
        <input
          value={activeOptions.title}
          onChange={(event) => updateOption('title', event.target.value)}
          placeholder={t('tools.titlePlaceholder', { tool: t(`tools.toolConfig.${activeTool.id}.shortTitle`) })}
        />
      </label>

      <div className="field-grid">
        <label className="field-stack">
          <span>{t('tools.subject')}</span>
          <input
            value={activeOptions.subject}
            onChange={(event) => updateOption('subject', event.target.value)}
          />
        </label>
        <label className="field-stack">
          <span>{t('tools.language')}</span>
          <input
            value={activeOptions.language}
            onChange={(event) => updateOption('language', event.target.value)}
          />
        </label>
      </div>

      <div className="field-grid">
        <label className="field-stack">
          <span>{t('tools.studentLevel')}</span>
          <select value={activeOptions.level} onChange={(event) => updateOption('level', event.target.value)}>
            {LEVELS.map((level) => (
              <option key={level} value={level}>{t(`tools.levels.${level}`)}</option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>{t('tools.difficulty')}</span>
          <select
            value={activeOptions.difficulty}
            onChange={(event) => updateOption('difficulty', event.target.value)}
          >
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>{t(`tools.difficulties.${difficulty}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="option-group">
        <legend>{modeLabel}</legend>
        <div className="segmented-options">
          {activeTool.modes.map((mode) => (
            <button
              className={activeOptions.mode === mode ? 'is-selected' : ''}
              key={mode}
              type="button"
              onClick={() => updateOption('mode', mode)}
            >
              {t(`tools.toolConfig.${activeTool.id}.modes.${mode}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="option-group">
        <legend>{t(`tools.toolConfig.${activeTool.id}.amountLabel`)}</legend>
        <div className="compact-options">
          {activeTool.amountOptions.map((amount) => (
            <button
              className={activeOptions.amount === amount ? 'is-selected' : ''}
              key={amount}
              type="button"
              onClick={() => updateOption('amount', amount)}
            >
              {amount}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="option-group">
        <legend>{t('tools.output')}</legend>
        <div className="compact-options output-options">
          {OUTPUT_FORMATS.map((format) => (
            <button
              className={activeOptions.output === format ? 'is-selected' : ''}
              key={format}
              type="button"
              onClick={() => updateOption('output', format)}
            >
              {t(`tools.outputs.${format}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="option-group">
        <legend>{t('tools.include')}</legend>
        <div className="check-options">
          {activeTool.extras.map((extra) => (
            <label key={extra}>
              <input
                checked={activeOptions.extras.includes(extra)}
                type="checkbox"
                onChange={() => toggleExtra(extra)}
              />
              <span>{t(`tools.toolConfig.${activeTool.id}.extras.${extra}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button className="tool-button tool-button-primary" type="button" onClick={handleGenerate}>
        <span aria-hidden="true">+</span>
        {t(`tools.toolConfig.${activeTool.id}.action`)}
      </button>
    </div>
  );
}

function PreviewPanel({ activeFiles, activeOptions, activeTool, generated }) {
  const { t } = useI18n();
  const amountLabel = t(`tools.toolConfig.${activeTool.id}.amountLabel`);
  const displayTitle = activeOptions.title.trim() || t(`tools.toolConfig.${activeTool.id}.resultTitle`);

  return (
    <div className="tool-panel tool-panel-preview">
      <div className="tool-panel-heading">
        <span className="tool-panel-step">03</span>
        <div>
          <h3>{t('tools.resultPreview')}</h3>
          <p>{t(`tools.toolConfig.${activeTool.id}.resultMeta`)}</p>
        </div>
      </div>

      <div className={`result-sheet ${generated ? 'is-generated' : ''}`}>
        <div className="result-sheet-top">
          <span>{t(`tools.outputs.${activeOptions.output}`)}</span>
          <span>{t('tools.amountSummary', { amount: activeOptions.amount, label: amountLabel.toLowerCase() })}</span>
        </div>
        <h4>{displayTitle}</h4>
        <p>{t('tools.forLevel', { subject: activeOptions.subject, level: t(`tools.levels.${activeOptions.level}`) })}</p>

        <div className="result-lines" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="result-section-list">
          {activeTool.previewSections.map((section) => (
            <div className="result-section" key={section}>
              <span />
              <strong>{t(`tools.toolConfig.${activeTool.id}.previewSections.${section}`)}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="result-footer">
        <div>
          <strong>{generated ? t('tools.generated') : t('tools.waiting')}</strong>
          <span>{t('common.sourcesAttached', { count: activeFiles.length })}</span>
        </div>
        <button className="tool-button tool-button-light" type="button">
          {t('tools.previewOutput', { output: t(`tools.outputs.${activeOptions.output}`) })}
        </button>
      </div>
    </div>
  );
}
