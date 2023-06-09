import { Octokit } from '@octokit/rest'
import { render } from 'preact'
import '../base.css'
import { getUserConfig, Theme } from '../config'
import { detectSystemColorScheme } from '../utils'
import ChatGPTContainer from './ChatGPTContainer'
import { config, SearchEngine } from './search-engine-configs'
import './styles.scss'
import { getPossibleElementByQuerySelector } from './utils'

async function mount(
  question: string,
  promptSource: string,
  siteConfig: SearchEngine,
  elementToMountOn: string[],
) {
  const container = document.createElement('div')
  container.className = 'chat-gpt-container'

  const userConfig = await getUserConfig()
  let theme: Theme
  if (userConfig.theme === Theme.Auto) {
    theme = detectSystemColorScheme()
  } else {
    theme = userConfig.theme
  }
  if (theme === Theme.Dark) {
    container.classList.add('gpt-dark')
  } else {
    container.classList.add('gpt-light')
  }

  const siderbarContainer = getPossibleElementByQuerySelector(elementToMountOn)
  console.debug('siderbarContainer: ' + siderbarContainer)
  if (siderbarContainer) {
    siderbarContainer.prepend(container)
  } else {
    container.classList.add('sidebar-free')
    const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
    if (appendContainer) {
      appendContainer.appendChild(container)
    }
  }

  render(
    <ChatGPTContainer
      question={question}
      promptSource={promptSource}
      triggerMode={userConfig.triggerMode || 'manually'}
    />,
    container,
  )
}

/**
 * mount html elements when requestions triggered
 * @param question question string
 * @param index question index
 */
export async function requeryMount(question: string, index: number) {
  const container = document.querySelector<HTMLDivElement>('.question-container')
  let theme: Theme
  const questionItem = document.createElement('div')
  questionItem.className = `question-${index}`

  const userConfig = await getUserConfig()
  if (userConfig.theme === Theme.Auto) {
    theme = detectSystemColorScheme()
  } else {
    theme = userConfig.theme
  }
  if (theme === Theme.Dark) {
    container?.classList.add('gpt-dark')
    questionItem.classList.add('gpt-dark')
  } else {
    container?.classList.add('gpt-light')
    questionItem.classList.add('gpt-light')
  }
  questionItem.innerText = `Q${index + 1} : ${question}`
  container?.appendChild(questionItem)
}

const siteRegex = new RegExp(Object.keys(config).join('|'))
const siteName = location.hostname.match(siteRegex)![0]
const siteConfig = config[siteName]
const fileListContainer = document.querySelector('#files')
const addedFiles: string[] = []

function splitDiffIntoFiles(diff: string): string[] {
  const fileDiffs = []
  const lines = diff.split('\n')

  let currentFileDiff = ''

  lines.forEach((line) => {
    if (line.startsWith('diff --git')) {
      if (currentFileDiff) {
        fileDiffs.push(currentFileDiff)
        currentFileDiff = ''
      }
    }
    currentFileDiff += line + '\n'
  })

  if (currentFileDiff) {
    fileDiffs.push(currentFileDiff)
  }

  return fileDiffs
}

function extractFilePathsFromDiff(diff: string): string[] {
  const filePaths: string[] = []
  const diffLines = diff.split('\n')

  diffLines.forEach((line) => {
    if (line.startsWith('+++ b/')) {
      const filePath = line.slice('+++ b/'.length)
      filePaths.push(filePath)
    }
  })

  return filePaths
}

async function run() {
  // Disconnect observer
  observer.disconnect()

  const searchInput = getPossibleElementByQuerySelector<HTMLInputElement>(siteConfig.inputQuery)
  console.debug('Try to Mount ChatGPT on', siteName)

  if (siteConfig.bodyQuery) {
    // const bodyElement = getPossibleElementByQuerySelector(siteConfig.bodyQuery)
    // const bodyElement = 'I love pineapples'

    // Extract repo owner and name from URL
    const currentUrl = window.location.href
    const url_parts = currentUrl.split('/')
    const owner = url_parts[3]
    const repo = url_parts[4]
    const pr_number = Number(url_parts[6])
    // const bodyElement = 'The best repo is ' + owner + '/' + repo + '/' + pr_number

    // Get diff
    const octokit = new Octokit()
    const response = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pr_number,
      mediaType: {
        format: 'diff',
      },
    })
    const diff = response.data as unknown as string

    // Generate prompt
    console.debug('Diff: ' + diff)

    // Extract file paths and split diff by file
    const filePaths = extractFilePathsFromDiff(diff)
    console.debug('First file diff: ' + filePaths[0])
    console.debug('All file diffs: ' + filePaths)

    const fileDiffs = splitDiffIntoFiles(diff)
    console.debug('First file diff: ' + fileDiffs[0])
    console.debug('All file diffs: ' + fileDiffs)

    // Get all elements relating to changed files. Note that this retrieves children
    // elements as well, which leads to some additional overhead. This overhead is
    // negligible given the constant and small number of changed files a PR usually has.
    const elementsWithDiffPrefix = document.querySelectorAll('[id^="diff-"]')
    console.debug('Number of elements found: ' + elementsWithDiffPrefix.length)

    const elementIds: string[] = []
    const dataPaths: string[] = []
    elementsWithDiffPrefix.forEach((element) => {
      const diffHtmlElement = element.querySelector('.file-header') as HTMLElement
      if (diffHtmlElement) {
        const dataPath = diffHtmlElement.dataset.path
        if (dataPath) {
          console.debug('current element ID: ' + element.id)
          elementIds.push(element.id)
          dataPaths.push(dataPath)
        }
      }
    })

    console.debug('All file paths: ' + dataPaths)

    console.debug('Second file path: ' + dataPaths[1])
    console.debug('Second extracted file path: ' + filePaths[1])
    console.debug('Corresponding diff for second file: ' + fileDiffs[1])
    console.debug('Corresponding ID for second file: ' + elementIds[1])

    // Note: by this point, the prompt should be finalized. The rest of the work is on cleaning it up,
    // running it through ChatGPT, and properly displaying the results.
    const normalizedFilePath = filePaths[1].trim().replace(/\r\n/g, '\n')
    const normalizedDataPath = dataPaths[1].trim().replace(/\r\n/g, '\n')

    console.debug(
      'extracted file path matches element file path: ' + normalizedFilePath + normalizedDataPath,
    )
    console.debug(normalizedFilePath[1] === normalizedDataPath[1])

    for (let i = 0; i < elementIds.length; i++) {
      const bodyElement = fileDiffs[i]
      if (bodyElement) {
        if (!addedFiles.includes(elementIds[i])) {
          addedFiles.push(elementIds[i])
          const userConfig = await getUserConfig()

          const found = userConfig.promptOverrides.find(
            (override) => new URL(override.site).hostname === location.hostname,
          )
          const question = found?.prompt ?? userConfig.prompt
          const promptSource = found?.site ?? 'default'
          console.debug('element mounted on: ' + ('#' + elementIds[i]))
          const elementToMountOn: string[] = ['#' + elementIds[i]]

          mount(question + bodyElement, promptSource, siteConfig, elementToMountOn)
        }
      }
    }

    // If all files have not been added yet, reconnect observer
    if (!(addedFiles.length === filePaths.length) && fileListContainer) {
      observer.observe(fileListContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      })
    }
  }
}

// Debounce function
function debounce(func: (...args: any[]) => void, wait: number): (...args: any[]) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Create a MutationObserver to watch for changes in the DOM
const observer = new MutationObserver(
  debounce((mutations: MutationRecord[]) => {
    run()
  }, 300),
)

// Start observing the document files for changes
if (fileListContainer) {
  observer.observe(fileListContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  })
}

run()

if (siteConfig.watchRouteChange) {
  siteConfig.watchRouteChange(run)
}
